"""Synchronous adapter for the experimental fixed-size Core ML denoiser."""
import json
from types import SimpleNamespace
import numpy as np
import torch
from model import ROOT, MODEL_DIR, REVISION


class CoreMLDenoiser(torch.nn.Module):
    def __init__(self, size):
        super().__init__()
        import coremltools as ct
        folder = ROOT / '.runtime/experiments/coreml'
        record = json.loads((folder / f'denoiser-{size}.json').read_text())
        if record.get('revision') != REVISION or record.get('size') != size:
            raise ValueError('Core ML model revision or dimensions mismatch')
        self.model = ct.models.MLModel(str(folder / f'denoiser-{size}.mlpackage'),
                                      compute_units=ct.ComputeUnit.CPU_AND_GPU)
        self.config = SimpleNamespace(**json.loads((MODEL_DIR / 'unet/config.json').read_text()))
        self.register_buffer('_marker', torch.zeros((), device='mps', dtype=torch.float16))

    @property
    def dtype(self):
        return self._marker.dtype

    @property
    def device(self):
        return self._marker.device

    def forward(self, sample, timestep, encoder_hidden_states, timestep_cond=None,
                cross_attention_kwargs=None, added_cond_kwargs=None, return_dict=False):
        if timestep_cond is not None or cross_attention_kwargs or added_cond_kwargs or return_dict:
            raise ValueError('Unsupported conditioning for this fixed Core ML graph')
        result = self.model.predict({
            'sample': sample.detach().cpu().numpy().astype(np.float16),
            'timestep': timestep.detach().cpu().numpy().reshape(1).astype(np.float16),
            'context': encoder_hidden_states.detach().cpu().numpy().astype(np.float16),
        })['prediction']
        return (torch.from_numpy(np.array(result, copy=True)).to(sample.device, sample.dtype),)
