"""Convert only the pinned denoiser to a fixed-size local Core ML program.

The encoder/decoder remain on MPS. Conversion is not a quality or speed claim.
"""
import os
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
import argparse
import json
import time
import numpy as np
import torch
import coremltools as ct
from diffusers import UNet2DConditionModel
from model import MODEL_DIR, ROOT, REVISION, verify_tensors


class Denoiser(torch.nn.Module):
    def __init__(self, unet):
        super().__init__()
        self.unet = unet

    def forward(self, sample, timestep, context):
        return self.unet(sample, timestep, encoder_hidden_states=context, return_dict=False)[0]


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--size', type=int, choices=[256, 384, 512], default=512)
    args = parser.parse_args()
    verify_tensors()
    unet = UNet2DConditionModel.from_pretrained(
        str(MODEL_DIR / 'unet'), variant='fp16', local_files_only=True,
        use_safetensors=True, torch_dtype=torch.float32,
    ).eval()
    torch.manual_seed(17)
    inputs = (torch.randn(1, 4, args.size // 8, args.size // 8),
              torch.tensor([499.], dtype=torch.float32), torch.randn(1, 77, 1024))
    wrapper = Denoiser(unet).eval()
    started = time.perf_counter()
    with torch.inference_mode():
        expected = wrapper(*inputs).numpy()
        traced = torch.jit.trace(wrapper, inputs, check_trace=False)
    print('Trace complete; converting fixed denoiser graph.', flush=True)
    converted = ct.convert(
        traced, convert_to='mlprogram', minimum_deployment_target=ct.target.macOS15,
        compute_units=ct.ComputeUnit.CPU_AND_GPU,
        compute_precision=ct.precision.FLOAT16,
        inputs=[ct.TensorType(name=name, shape=value.shape, dtype=np.float16)
                for name, value in zip(['sample', 'timestep', 'context'], inputs)],
        outputs=[ct.TensorType(name='prediction', dtype=np.float16)],
    )
    folder = ROOT / '.runtime/experiments/coreml'; folder.mkdir(parents=True, exist_ok=True)
    destination = folder / f'denoiser-{args.size}.mlpackage'
    converted.save(str(destination))
    actual = converted.predict({name: value.numpy().astype(np.float16)
                                for name, value in zip(['sample', 'timestep', 'context'], inputs)})['prediction']
    if actual.shape != expected.shape or not np.isfinite(actual).all():
        raise RuntimeError('Converted model produced an invalid prediction')
    record = {'revision': REVISION, 'size': args.size,
              'conversion_seconds': round(time.perf_counter() - started, 1),
              'probe_mean_abs_error': float(np.mean(np.abs(actual - expected))),
              'probe_max_abs_error': float(np.max(np.abs(actual - expected))),
              'acceptance': 'NOT ACCEPTED; requires complete pipeline and quality evaluation'}
    (folder / f'denoiser-{args.size}.json').write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(record), flush=True)
