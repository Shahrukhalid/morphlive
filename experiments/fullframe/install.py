"""Explicit public-model download. Inference itself is strictly offline."""
import os
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'
os.environ['HF_HUB_DISABLE_XET'] = '1'

from huggingface_hub import snapshot_download
from model import (MODEL_ID, REVISION, MODEL_DIR, TENSORS, verify_tensors,
                   TINY_ID, TINY_REVISION, TINY_DIR, TINY_SHA256, verify_tiny)
import argparse
import hashlib
import ssl
import urllib.request
import certifi


def repair_tensor(relative, expected, directory=MODEL_DIR, repo=MODEL_ID, revision=REVISION):
    target = directory / relative
    if target.exists():
        with target.open('rb') as stream:
            if hashlib.file_digest(stream, 'sha256').hexdigest() == expected:
                return
    # A resumed transfer can be incomplete despite the expected final file size.
    # Start fresh and publish the local file only after its complete hash matches.
    temporary = target.with_suffix('.verified-download')
    try:
        digest = hashlib.sha256()
        url = f'https://huggingface.co/{repo}/resolve/{revision}/{relative}'
        context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(url, context=context, timeout=60) as response, temporary.open('wb') as output:
            while chunk := response.read(8 * 1024 * 1024):
                output.write(chunk)
                digest.update(chunk)
        if digest.hexdigest() != expected:
            raise RuntimeError('Fresh experimental tensor failed checksum validation')
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tiny', action='store_true', help='Also install the optional faster, lossy MIT autoencoder')
    args = parser.parse_args()
    snapshot_download(
        MODEL_ID, revision=REVISION, local_dir=MODEL_DIR, token=False,
        allow_patterns=[*TENSORS, 'model_index.json', 'README.md', 'LICENSE*',
                        'scheduler/*', 'tokenizer/*', 'text_encoder/config.json',
                        'unet/config.json', 'vae/config.json'],
        max_workers=2,
    )
    for relative, expected in TENSORS.items():
        repair_tensor(relative, expected)
    verify_tensors()
    if args.tiny:
        snapshot_download(TINY_ID, revision=TINY_REVISION, local_dir=TINY_DIR, token=False,
                          allow_patterns=['config.json', 'diffusion_pytorch_model.safetensors', 'README.md', 'LICENSE*'])
        repair_tensor('diffusion_pytorch_model.safetensors', TINY_SHA256, TINY_DIR, TINY_ID, TINY_REVISION)
        verify_tiny()
    print('Verified local experimental tensors. No capture or app setting changed.')
