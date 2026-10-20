"""Pinned public model specification; no runtime downloads."""
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODEL_ID = 'stabilityai/sd-turbo'
REVISION = 'b261bac6fd2cf515557d5d0707481eafa0485ec2'
MODEL_DIR = ROOT / '.runtime/experiments/sd-turbo'
TINY_ID = 'madebyollin/taesd'
TINY_REVISION = '614f76814bbe30edbe2e627ace1c2234c81a2c0e'
TINY_DIR = ROOT / '.runtime/experiments/taesd'
TINY_SHA256 = 'db169d69145ec4ff064e49d99c95fa05d3eb04ee453de35824a6d0f325513549'
TENSORS = {
    'text_encoder/model.fp16.safetensors': 'bc1827c465450322616f06dea41596eac7d493f4e95904dcb51f0fc745c4e13f',
    'unet/diffusion_pytorch_model.fp16.safetensors': '40ec400881e27d1376c7c95c5bd495f407b33756e80eb6365e301c33a07af6e5',
    'vae/diffusion_pytorch_model.fp16.safetensors': '3e4c08995484ee61270175e9e7a072b66a6e4eeb5f0c266667fe1f45b90daf9a',
}


def verify_tensors():
    for relative, expected in TENSORS.items():
        with (MODEL_DIR / relative).open('rb') as stream:
            actual = hashlib.file_digest(stream, 'sha256').hexdigest()
        if actual != expected:
            raise ValueError('Experimental model checksum mismatch; rerun install.py')


def verify_tiny():
    with (TINY_DIR / 'diffusion_pytorch_model.safetensors').open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != TINY_SHA256:
            raise ValueError('Experimental tiny autoencoder checksum mismatch')
