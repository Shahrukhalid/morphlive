"""Benchmark real neural inference with fictional still input; no capture devices."""
import argparse
import json
from pathlib import Path
import time
import sys
if sys.platform=='darwin':
    import ctypes
    ctypes.CDLL('/usr/lib/libSystem.B.dylib').pthread_set_qos_class_self_np(0x19,0)
import cv2
import numpy as np
from faceswap import FaceSwapEngine, ROOT

parser = argparse.ArgumentParser()
parser.add_argument('--frames', type=int, default=12)
parser.add_argument('--engine',choices=['faceswap'],default='faceswap')
parser.add_argument('--width',type=int,default=640)
parser.add_argument('--height',type=int,default=640)
parser.add_argument('--warmups',type=int,default=3)
parser.add_argument('--restore',action='store_true')
args = parser.parse_args()
if not 1 <= args.frames <= 120:
    parser.error('frames must be 1..120')
if not 128<=args.width<=1920 or not 128<=args.height<=1080 or not 0<=args.warmups<=10:
    parser.error('use width 128..1920, height 128..1080, warmups 0..10')
started = time.perf_counter()
engine=FaceSwapEngine(enhance=args.restore)
rgb = cv2.cvtColor(cv2.imread(str(ROOT / '.runtime/references/fictional-male.png')), cv2.COLOR_BGR2RGB)
scale=min(args.width/rgb.shape[1],args.height/rgb.shape[0])
resized=cv2.resize(rgb,(round(rgb.shape[1]*scale),round(rgb.shape[0]*scale)))
rgb=np.full((args.height,args.width,3),100,np.uint8)
y=(args.height-resized.shape[0])//2;x=(args.width-resized.shape[1])//2
rgb[y:y+resized.shape[0],x:x+resized.shape[1]]=resized
times = []
try:
    for i in range(args.frames+args.warmups):
        # Deterministic different head alignment; this is synthetic-input timing,
        # not observed human blink/lip fidelity or conferencing performance.
        matrix = cv2.getRotationMatrix2D((rgb.shape[1]/2, rgb.shape[0]/2), 2*np.sin(i/5), 1)
        driving = cv2.warpAffine(rgb, matrix, (rgb.shape[1], rgb.shape[0]))
        output, ms, tracked = engine.process(driving)
        if i >= args.warmups:
            times.append(ms)
        print(json.dumps({'frame': i, 'ms': round(ms, 1), 'tracked': tracked}), flush=True)
    dest = ROOT / ('artifacts/neural-'+args.engine+'-test.png')
    dest.parent.mkdir(exist_ok=True)
    cv2.imwrite(str(dest), cv2.cvtColor(output, cv2.COLOR_RGB2BGR))
    print(json.dumps({'device':engine.wrapper.device, 'frames':len(times),
                      'width':args.width,'height':args.height,'warmups':args.warmups,'restoration':args.restore,
                      'mean_ms':round(float(np.mean(times)),1),
                      'p95_ms':round(float(np.percentile(times,95)),1),
                      'fps':round(1000/float(np.mean(times)),2)}), flush=True)
finally:
    engine.close()
