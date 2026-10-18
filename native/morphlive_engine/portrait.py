"""Local neural portrait animation. No camera, network, recording, or voice cloning.

Loads the separately installed MIT LivePortrait human models. MediaPipe supplies
the crop, so the upstream InsightFace detector/recognition weights are not used.
"""
from pathlib import Path
import contextlib
import json
import os
import sys
import time

import cv2
import mediapipe as mp
import numpy as np
import torch
from images import reference_rgb

if os.environ.get('MORPHLIVE_CPU_GRID', '1') == '1':
    # M5 / torch 2.9.1: native MPS volumetric sampling produced streaks in QA.
    # Keep this operation on CPU; neural convolutions remain on the GPU.
    import torch.nn.functional as functional
    _grid_sample = functional.grid_sample
    def _diagnostic_grid(input, grid, *args, **kwargs):
        if input.device.type == 'mps' and input.ndim == 5:
            return _grid_sample(input.float().cpu(), grid.float().cpu(), *args, **kwargs).to(input.device, input.dtype)
        return _grid_sample(input, grid, *args, **kwargs)
    functional.grid_sample = _diagnostic_grid

ROOT = Path(os.environ.get('MORPHLIVE_RUNTIME_ROOT', Path(__file__).resolve().parents[2]))
VENDOR = ROOT / '.runtime/vendor/LivePortrait'
REFERENCE_IDS = {item['id'] for item in json.loads((Path(__file__).resolve().parents[1]/'references.json').read_text())}
sys.path.insert(0, str(VENDOR))


class PortraitEngine:
    def __init__(self, reference='fictional-female', widescreen=True):
        self.widescreen = widescreen
        # Keep upstream load messages off the stdio response channel.
        with contextlib.redirect_stdout(sys.stderr):
            from src.config.inference_config import InferenceConfig
            from src.live_portrait_wrapper import LivePortraitWrapper
            from src.utils.camera import get_rotation_matrix
            from src.utils.crop import crop_image
            self.rotation = get_rotation_matrix
            self.crop_image = crop_image
            self.wrapper = LivePortraitWrapper(InferenceConfig(
                flag_use_half_precision=False, flag_do_torch_compile=False,
                flag_force_cpu=os.environ.get('MORPHLIVE_CPU') == '1'))
            if os.environ.get('MORPHLIVE_FP16') == '1' and self.wrapper.device == 'mps':
                self.wrapper.inference_cfg.flag_use_half_precision = True
                self.wrapper.inference_ctx = lambda: torch.autocast(device_type='mps', dtype=torch.float16)
        model_paths = [
            ROOT / 'apps/desktop/public/models/face_landmarker.task',
            ROOT / 'dist/models/face_landmarker.task',
            Path(__file__).resolve().parents[2] / 'apps/desktop/public/models/face_landmarker.task',
            Path(__file__).resolve().parents[2] / 'dist/models/face_landmarker.task',
        ]
        model = next((p for p in model_paths if p.exists()), model_paths[0])
        self.detector = mp.tasks.vision.FaceLandmarker.create_from_options(
            mp.tasks.vision.FaceLandmarkerOptions(
                base_options=mp.tasks.BaseOptions(model_asset_path=str(model)),
                running_mode=mp.tasks.vision.RunningMode.IMAGE, num_faces=1))
        self.initial = None
        self.set_reference(reference)

    def crop(self, rgb):
        result = self.detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,
                                                data=np.ascontiguousarray(rgb)))
        if not result.face_landmarks:
            return None
        h, w = rgb.shape[:2]
        p = np.array([[v.x*w, v.y*h] for v in result.face_landmarks[0]], dtype=np.float32)
        five = np.stack([p[[33, 133]].mean(0), p[[362, 263]].mean(0),
                         p[1], p[61], p[291]])
        return self.crop_image(rgb, five, dsize=256, scale=2.3,
                               vy_ratio=-0.125, flag_do_rot=True)['img_crop']

    def set_reference(self, reference):
        # IDs only: never accept a renderer-provided file path.
        if reference not in REFERENCE_IDS:
            raise ValueError('Unknown local reference')
        crop = self.crop(reference_rgb(ROOT / '.runtime/references' / (reference+'.png')))
        if crop is None:
            raise ValueError('Reference needs one visible adult face')
        with torch.inference_mode():
            x = self.wrapper.prepare_source(crop)
            self.source = self.wrapper.get_kp_info(x)
            self.features = self.wrapper.extract_feature_3d(x)
            self.source_points = self.wrapper.transform_keypoint(self.source)
            self.source_rotation = self.rotation(self.source['pitch'], self.source['yaw'], self.source['roll'])
        self.initial = None

    def format_widescreen(self, portrait_512, target_w=1280, target_h=720):
        scaled = cv2.resize(portrait_512, (target_h, target_h), interpolation=cv2.INTER_LINEAR)
        bg = cv2.resize(portrait_512, (target_w // 4, target_h // 4), interpolation=cv2.INTER_AREA)
        bg = cv2.GaussianBlur(bg, (19, 19), 0)
        bg = cv2.resize(bg, (target_w, target_h), interpolation=cv2.INTER_LINEAR)
        x_offset = (target_w - target_h) // 2
        feather = 24
        alpha = np.ones((target_h, target_h, 1), dtype=np.float32)
        alpha[:, :feather] = np.linspace(0, 1, feather)[None, :, None]
        alpha[:, -feather:] = np.linspace(1, 0, feather)[None, :, None]
        canvas = bg
        center_roi = canvas[:, x_offset:x_offset + target_h]
        canvas[:, x_offset:x_offset + target_h] = (scaled * alpha + center_roi * (1.0 - alpha)).astype(np.uint8)
        return canvas

    def process(self, rgb):
        started = time.perf_counter()
        crop = self.crop(rgb)
        if crop is None:
            # Never pass the original identity through when tracking is lost.
            self.initial = None
            out_shape = (720, 1280, 3) if self.widescreen else (512, 512, 3)
            output = np.zeros(out_shape, dtype=np.uint8)
            return output, (time.perf_counter()-started)*1000, False
        with torch.inference_mode():
            current = self.wrapper.get_kp_info(self.wrapper.prepare_source(crop))
            rotation = self.rotation(current['pitch'], current['yaw'], current['roll'])
            if self.initial is None:
                self.initial = {k: v.clone() for k, v in current.items()}
                self.initial_rotation = rotation.clone()
            base, source = self.initial, self.source
            relative_rotation = rotation @ self.initial_rotation.permute(0, 2, 1) @ self.source_rotation
            expression = source['exp'] + current['exp'] - base['exp']
            scale = source['scale'] * (current['scale'] / base['scale'])
            translation = source['t'] + current['t'] - base['t']
            translation[..., 2] = 0
            driving = scale[..., None] * (source['kp'] @ relative_rotation + expression) + translation[:, None, :]
            driving = self.wrapper.stitching(self.source_points, driving)
            decoded = self.wrapper.warp_decode(self.features, self.source_points, driving)
            output = np.ascontiguousarray(self.wrapper.parse_output(decoded['out'])[0])
            if self.widescreen:
                output = self.format_widescreen(output)
        return output, (time.perf_counter()-started)*1000, True

    def close(self):
        self.detector.close()
