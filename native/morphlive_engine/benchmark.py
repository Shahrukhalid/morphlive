"""Benchmark real neural inference with fictional still input; no capture devices."""
import argparse
import json
from pathlib import Path
import time
import cv2
import numpy as np
from portrait import PortraitEngine, ROOT

parser = argparse.ArgumentParser()
parser.add_argument('--frames', type=int, default=12)
parser.add_argument('--engine',choices=['portrait','faceswap'],default='portrait')
args = parser.parse_args()
if not 1 <= args.frames <= 120:
    parser.error('frames must be 1..120')
started = time.perf_counter()
if args.engine=='faceswap':
    from faceswap import FaceSwapEngine
    engine=FaceSwapEngine()
else:
    engine = PortraitEngine()
rgb = cv2.cvtColor(cv2.imread(str(ROOT / '.runtime/references/fictional-male.png')), cv2.COLOR_BGR2RGB)
times = []
try:
    for i in range(args.frames+2):
        # Deterministic different head alignment; this is synthetic-input timing,
        # not observed human blink/lip fidelity or conferencing performance.
        matrix = cv2.getRotationMatrix2D((rgb.shape[1]/2, rgb.shape[0]/2), i*.5, 1)
        driving = cv2.warpAffine(rgb, matrix, (rgb.shape[1], rgb.shape[0]))
        output, ms, tracked = engine.process(driving)
        if i >= 2:
            times.append(ms)
        print(json.dumps({'frame': i, 'ms': round(ms, 1), 'tracked': tracked}), flush=True)
    dest = ROOT / ('artifacts/neural-'+args.engine+'-test.png')
    dest.parent.mkdir(exist_ok=True)
    cv2.imwrite(str(dest), cv2.cvtColor(output, cv2.COLOR_RGB2BGR))
    print(json.dumps({'device':engine.wrapper.device, 'frames':len(times),
                      'mean_ms':round(float(np.mean(times)),1),
                      'p95_ms':round(float(np.percentile(times,95)),1),
                      'fps':round(1000/float(np.mean(times)),2)}), flush=True)
finally:
    engine.close()
