"""Offline whole-frame candidate. Never imported by the shipping camera worker.

This is prompt-conditioned image translation, not identity-preserving video
generation. Fixed noise reduces one source of flicker; it does not establish
temporal consistency, correct expression transfer, or realistic output.
"""
import os
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'

import time
import numpy as np
from PIL import Image
import torch

from model import MODEL_DIR, TINY_DIR, verify_tensors, verify_tiny
PROMPTS = {
    'feminine': 'Photorealistic camera portrait of an adult woman, natural skin texture, shoulder length brown hair, clean shaven face, realistic eyes, neutral lighting',
    'masculine': 'Photorealistic camera portrait of an adult man, natural skin texture, short dark hair, clean shaven face, realistic eyes, neutral lighting',
}


class WholeFrameCandidate:
    def __init__(self, appearance='feminine', size=512, steps=2, strength=.5, backend='mps', vae='full'):
        if appearance not in PROMPTS or size not in (256, 384, 512):
            raise ValueError('Unsupported fictional appearance or size')
        if not 1 <= steps <= 4 or not 0 < strength <= 1 or int(steps * strength) < 1:
            raise ValueError('Use 1..4 steps and strength producing at least one denoising step')
        if not torch.backends.mps.is_available():
            raise RuntimeError('This candidate requires Apple Silicon MPS')
        verify_tensors()
        from diffusers import AutoPipelineForImage2Image
        self.size, self.steps, self.strength = size, steps, strength
        self.pipe = AutoPipelineForImage2Image.from_pretrained(
            str(MODEL_DIR), variant='fp16', torch_dtype=torch.float16,
            local_files_only=True, use_safetensors=True,
        ).to('mps')
        self.pipe.set_progress_bar_config(disable=True)
        if vae == 'tiny':
            verify_tiny()
            from diffusers import AutoencoderTiny
            self.pipe.vae = AutoencoderTiny.from_pretrained(
                str(TINY_DIR), local_files_only=True, use_safetensors=True,
                torch_dtype=torch.float16,
            ).to('mps')
        elif vae != 'full':
            raise ValueError('Unknown experimental autoencoder')
        self.pipe.unet.to(memory_format=torch.channels_last)
        with torch.inference_mode():
            self.embeds = self.pipe.encode_prompt(
                PROMPTS[appearance], device='mps', num_images_per_prompt=1,
                do_classifier_free_guidance=False,
            )[0]
        # Prompt encoding is done once, not charged to each completed frame.
        self.pipe.text_encoder = None
        if backend == 'coreml':
            from coreml_denoiser import CoreMLDenoiser
            self.pipe.unet = CoreMLDenoiser(size)
        elif backend != 'mps':
            raise ValueError('Unknown experimental backend')
        torch.mps.empty_cache()
        self.busy = False
        self.closed = False

    def process(self, rgb):
        if self.closed or self.busy:
            raise RuntimeError('Candidate is closed or already processing a frame')
        if not isinstance(rgb, np.ndarray) or rgb.dtype != np.uint8 or rgb.shape != (self.size, self.size, 3):
            raise ValueError('Expected a square RGB uint8 frame at the configured size')
        self.busy = True
        try:
            torch.mps.synchronize()
            start = time.perf_counter()
            # Reinitialize the CPU generator: identical noise for each new input.
            # No previous image is blended in and no generated portrait is animated.
            with torch.inference_mode():
                result = self.pipe(
                    prompt_embeds=self.embeds, image=Image.fromarray(rgb),
                    num_inference_steps=self.steps, strength=self.strength,
                    guidance_scale=0., generator=torch.Generator('cpu').manual_seed(17),
                    output_type='np',
                ).images[0]
            torch.mps.synchronize()
            if result.shape != rgb.shape or not np.isfinite(result).all():
                raise RuntimeError('Invalid generated frame')
            output = np.ascontiguousarray(np.clip(result * 255, 0, 255).astype(np.uint8))
            return output, (time.perf_counter() - start) * 1000
        finally:
            self.busy = False

    def close(self):
        self.closed = True
        self.embeds = None
        self.pipe = None
        torch.mps.empty_cache()
