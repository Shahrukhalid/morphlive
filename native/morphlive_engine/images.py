"""Inspect dimensions before decoding untrusted local image inputs."""
from io import BytesIO
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps


def reference_rgb(path):
    if Path(path).stat().st_size>10_000_000:
        raise ValueError('Reference is too large')
    with Image.open(path) as image:
        if image.format not in ('JPEG','PNG','WEBP') or not 128<=image.width<=4096 or not 128<=image.height<=4096:
            raise ValueError('Reference dimensions or format are unsupported')
        return np.ascontiguousarray(np.asarray(ImageOps.exif_transpose(image).convert('RGB')))


def check_jpeg(raw):
    with Image.open(BytesIO(raw)) as image:
        if image.format!='JPEG' or not 1<=image.width<=1920 or not 1<=image.height<=1080:
            raise ValueError('Invalid frame dimensions or format')
