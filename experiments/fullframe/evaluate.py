"""Fictional-input acceptance probe; no camera, microphone, or video output.

Writes only a fictional contact sheet and aggregate measurements to artifacts/.
Synthetic affine motion cannot establish expression or hand-occlusion fidelity.
"""
import argparse
import json
from pathlib import Path
import time
import cv2
import numpy as np
from PIL import Image, ImageDraw
from model import ROOT, MODEL_ID, REVISION, TINY_REVISION
from report import summarize


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--appearance', choices=['feminine', 'masculine'], default='feminine')
    parser.add_argument('--size', choices=[256, 384, 512], type=int, default=512)
    parser.add_argument('--steps', type=int, default=2)
    parser.add_argument('--strength', type=float, default=.5)
    parser.add_argument('--frames', type=int, default=12)
    parser.add_argument('--warmups', type=int, default=2)
    parser.add_argument('--backend', choices=['mps', 'coreml'], default='mps')
    parser.add_argument('--vae', choices=['full', 'tiny'], default='full')
    args = parser.parse_args()
    if not 3 <= args.frames <= 120 or not 1 <= args.warmups <= 10:
        parser.error('Use 3..120 frames and 1..10 warmups')
    # Only the existing fictional test portrait is accepted by this probe.
    with Image.open(ROOT / '.runtime/references/fictional-male.png') as source:
        rgb = np.array(source.convert('RGB').resize((args.size, args.size)))
    from engine import WholeFrameCandidate
    engine = WholeFrameCandidate(args.appearance, args.size, args.steps, args.strength, args.backend, args.vae)
    times, examples = [], []
    try:
        for i in range(args.frames + args.warmups):
            matrix = cv2.getRotationMatrix2D((args.size / 2, args.size / 2), 4 * np.sin(i / 3), 1)
            frame = cv2.warpAffine(rgb, matrix, (args.size, args.size), borderMode=cv2.BORDER_REFLECT_101)
            start = time.perf_counter()
            output, model_ms = engine.process(frame)
            wall_ms = (time.perf_counter() - start) * 1000
            if i >= args.warmups:
                times.append(wall_ms)
                if len(examples) < 3:
                    examples.append((frame, output))
            print(json.dumps({'frame': i, 'warmup': i < args.warmups,
                              'processing_ms': round(wall_ms, 2), 'engine_ms': round(model_ms, 2)}), flush=True)
    finally:
        engine.close()
    report = {
        'candidate': MODEL_ID, 'revision': REVISION,
        'device': 'mps' if args.backend == 'mps' else 'Core ML CPU/GPU denoiser + MPS encoder/decoder',
        'tiny_revision': TINY_REVISION if args.vae == 'tiny' else None,
        'input': 'fictional portrait with synthetic affine motion',
        'measurement': 'sequential completed-frame processing; excludes camera, transport, conferencing',
        **vars(args), **summarize(times),
    }
    folder = ROOT / 'artifacts/fullframe'; folder.mkdir(parents=True, exist_ok=True)
    label = f'{args.backend}-{args.vae}-{args.appearance}-{args.size}-{args.steps}-{args.strength}'
    (folder / (label + '.json')).write_text(json.dumps(report, indent=2) + '\n')
    sheet = Image.new('RGB', (args.size * 2, (args.size + 28) * len(examples)))
    draw = ImageDraw.Draw(sheet)
    for row, (frame, output) in enumerate(examples):
        y = row * (args.size + 28)
        draw.text((8, y + 6), 'FICTIONAL INPUT / synthetic motion', fill='white')
        draw.text((args.size + 8, y + 6), 'EXPERIMENTAL whole-frame output', fill='white')
        sheet.paste(Image.fromarray(frame), (0, y + 28))
        sheet.paste(Image.fromarray(output), (args.size, y + 28))
    sheet.save(folder / (label + '.png'))
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
