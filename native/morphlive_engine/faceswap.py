"""Local GhostV2 face swap; BSD generator and MIT CVLFace identity model.

No InsightFace model, network, recording, or voice conversion is used.
"""
import json
import hashlib
import os
from pathlib import Path
import sys
import time
import cv2
import mediapipe as mp
import numpy as np
import torch
from safetensors.torch import load_file
from images import reference_rgb
from composite import blend_face

ROOT=Path(os.environ.get('MORPHLIVE_RUNTIME_ROOT',Path(__file__).resolve().parents[2]))
CATALOG=Path(__file__).resolve().parents[1]/'references.json'
REFERENCE_IDS={item['id'] for item in json.loads(CATALOG.read_text())}
sys.path.insert(0,str(ROOT/'.runtime/vendor/ghostv2'))


def similarity(source, destination):
    """Least-squares similarity with reflection excluded, using all five points."""
    source_center=source.mean(0); destination_center=destination.mean(0)
    centered=source-source_center; target=destination-destination_center
    u, singular, vt=np.linalg.svd(target.T@centered/len(source))
    sign=np.ones(2)
    if np.linalg.det(u@vt)<0:
        sign[-1]=-1
    rotation=u@np.diag(sign)@vt
    scale=np.sum(singular*sign)/np.mean(np.sum(centered**2,axis=1))
    linear=scale*rotation
    return np.column_stack([linear,destination_center-linear@source_center]).astype(np.float32)


class FaceSwapEngine:
    def __init__(self, reference='fictional-female', enhance=False):
        from Ghost.AEI_Net import AEI_Net
        from CVLFace import get_vit_model
        self.device='mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'
        self.dtype=torch.float16 if self.device!='cpu' else torch.float32
        self.size=256
        self.G=AEI_Net('unet',num_blocks=2,c_id=512,align_corners=True)
        weights=ROOT/'.runtime/models/ghostv2'
        state={k.replace('_orig_mod.',''):v for k,v in load_file(str(weights/'generator.safetensors')).items()}
        self.G.load_state_dict(state,strict=True)
        self.G=self.G.to(self.device,self.dtype).eval()
        if self.device=='mps':
            self.G=self.G.to(memory_format=torch.channels_last)
        self.restorer=None
        if enhance or os.environ.get('MORPHLIVE_RESTORE')=='1':
            from GFPGAN.gfpganv1_clean_arch import GFPGANv1Clean
            self.restorer=GFPGANv1Clean(out_size=512,num_style_feat=512,channel_multiplier=2,
                                      decoder_load_path=None,fix_decoder=False,num_mlp=8,
                                      input_is_latent=True,different_w=True,narrow=1,sft_half=True)
            self.restorer.load_state_dict(load_file(str(weights/'restorer.safetensors')),strict=True)
            self.restorer=self.restorer.to(self.device,torch.float32).eval()
        self.detector=mp.tasks.vision.FaceLandmarker.create_from_options(mp.tasks.vision.FaceLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(ROOT/'apps/desktop/public/models/face_landmarker.task')),
            running_mode=mp.tasks.vision.RunningMode.IMAGE,num_faces=1))
        if reference not in REFERENCE_IDS:
            raise ValueError('Unknown local reference')
        source=reference_rgb(ROOT/'.runtime/references'/(reference+'.png'))
        aligned=self.align(source,size=256)
        if aligned is None:
            raise ValueError('Reference needs one visible adult face')
        # Cache identity once. The large recognizer is not run per video frame.
        recognizer=get_vit_model(str(weights/'recognizer.safetensors'),device=self.device)
        self.identity_cache={};self.credits={}
        attribution_file=CATALOG.parent/'actor-references.json'
        attributions=json.loads(attribution_file.read_text()) if attribution_file.exists() else []
        with torch.inference_mode():
            for ident in REFERENCE_IDS:
                file=ROOT/'.runtime/references'/(ident+'.png')
                if not file.exists():
                    continue
                image=source if ident==reference else reference_rgb(file)
                face=aligned if ident==reference else self.align(image,size=256)
                if face is None:
                    continue
                tensor=self.tensor(face[0],dtype=torch.float32)
                tensor=torch.nn.functional.interpolate(tensor,(112,112),mode='bilinear')
                self.identity_cache[ident]=torch.nn.functional.normalize(recognizer(tensor)).to(self.dtype)
                match=next((item for item in attributions if item['id']==ident),None)
                if match and hashlib.sha256(file.read_bytes()).hexdigest()==match['sha256']:
                    self.credits[ident]=match
        self.set_reference(reference)
        del recognizer
        with torch.inference_mode():
            self.G(self.tensor(aligned[0]),self.identity)
        if self.device=='mps':
            torch.mps.synchronize()
        if self.device=='mps':
            torch.mps.empty_cache()
        self.initial=None

    def set_reference(self,reference):
        if reference not in self.identity_cache:
            raise ValueError('Reference unavailable; stop and import a clear adult portrait')
        self.identity=self.identity_cache[reference]
        self.credit=self.credits.get(reference)

    def tensor(self,rgb,dtype=None):
        return torch.from_numpy(np.ascontiguousarray(rgb)).permute(2,0,1).unsqueeze(0).to(self.device,dtype or self.dtype)/127.5-1

    def align(self,rgb,size=None):
        size=size or self.size
        result=self.detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(rgb)))
        if not result.face_landmarks:
            return None
        h,w=rgb.shape[:2]
        p=np.array([[v.x*w,v.y*h] for v in result.face_landmarks[0]],dtype=np.float32)
        five=np.stack([p[[33,133]].mean(0),p[[362,263]].mean(0),p[1],p[61],p[291]])
        template=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],dtype=np.float32)
        template[:,0]+=8
        matrix=similarity(five,template*(size/128))
        crop=cv2.warpAffine(rgb,matrix,(size,size),borderMode=cv2.BORDER_REFLECT_101)
        return crop,matrix,p

    def process(self,rgb):
        start=time.perf_counter();aligned=self.align(rgb)
        if aligned is None:
            output=np.zeros_like(rgb)
            return output,(time.perf_counter()-start)*1000,False
        target,matrix,points=aligned
        with torch.inference_mode():
            generated,_=self.G(self.tensor(target),self.identity)
            if self.restorer is not None:
                enlarged=torch.nn.functional.interpolate(generated,(512,512),mode='bilinear',align_corners=False)
                restored,_=self.restorer(enlarged.float(),return_rgb=False,randomize_noise=False)
                generated=.65*restored+.35*enlarged
            generated=generated.float().squeeze(0).permute(1,2,0).cpu().numpy()
        generated=np.ascontiguousarray(np.clip((generated+1)*127.5,0,255).astype(np.uint8))
        if generated.shape[0]!=self.size:
            ratio=generated.shape[0]/self.size
            matrix=matrix*ratio
        output=blend_face(rgb,generated,matrix,points)
        # Keep video clean. Reference attribution remains in the app and manifest.
        return output,(time.perf_counter()-start)*1000,True

    @property
    def wrapper(self):
        return self

    def close(self):
        self.detector.close()
