"""Optional local face visibility model. No capture, network, or media storage."""
import hashlib
import sys
import cv2
import numpy as np

MODEL_SHA256='48ccd7e8541e159a5a754ec9e62df2f12065f7df8f9af842c1750342c6533559'


class OcclusionGuard:
    def __init__(self, path):
        if hashlib.sha256(path.read_bytes()).hexdigest()!=MODEL_SHA256:
            raise ValueError('Occlusion model checksum mismatch; reinstall the local model.')
        import onnxruntime as ort
        ort.disable_telemetry_events()
        options=ort.SessionOptions()
        options.intra_op_num_threads=2
        options.log_severity_level=3
        providers=['CPUExecutionProvider']
        if sys.platform=='darwin' and 'CoreMLExecutionProvider' in ort.get_available_providers():
            providers.insert(0,'CoreMLExecutionProvider')
        self.session=ort.InferenceSession(str(path),sess_options=options,providers=providers)
        self.input=self.session.get_inputs()[0].name

    def visibility(self, aligned_rgb):
        image=cv2.resize(aligned_rgb,(256,256))
        value=np.ascontiguousarray(image[:,:,::-1][None],dtype=np.float32)/255
        probability=self.session.run(None,{self.input:value})[0].squeeze()
        if probability.shape!=(256,256) or not np.isfinite(probability).all():
            raise ValueError('Invalid occlusion prediction.')
        # Preserve uncertain/obstructed pixels; soften only within confident face.
        mask=np.clip((probability-.7)/.25,0,1).astype(np.float32)
        return cv2.erode(mask,np.ones((3,3),np.uint8))
