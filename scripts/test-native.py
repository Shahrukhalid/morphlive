"""Explicit fictional-input integration probe; never opens a physical device."""
import argparse
import base64
import json
from pathlib import Path
import subprocess
import sys
import time
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--virtual',action='store_true',help='Send fictional frames to the installed virtual camera')
parser.add_argument('--restore',action='store_true',help='Include the optional slower full-precision detail model')
parser.add_argument('--seconds',type=int,default=0,help='Keep fictional virtual output active for receiver verification, max 300')
args=parser.parse_args()
if not 0<=args.seconds<=300:
    parser.error('seconds must be 0..300')


def main():
    process=subprocess.Popen([sys.executable,str(ROOT/'native/morphlive_engine/server.py')],cwd=ROOT,
                             stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
    def command(value):
        process.stdin.write(json.dumps(value)+'\n');process.stdin.flush()
        response=json.loads(process.stdout.readline(1_500_001))
        if response.get('ok') is not True:
            raise RuntimeError(response.get('error','Native probe failed'))
        return response
    try:
        command({'op':'start','backend':'faceswap','reference':'fictional-female','enhance':args.restore})
        catalog=json.loads((ROOT/'native/references.json').read_text())
        count=0
        for item in catalog:
            if (ROOT/'.runtime/references'/(item['id']+'.png')).exists():
                command({'op':'reference','reference':item['id']});count+=1
        print('Cached reference switching PASS:',count,flush=True)
        command({'op':'reference','reference':'fictional-female'})
        source=cv2.imread(str(ROOT/'.runtime/references/fictional-male.png'))
        source=cv2.resize(source,(640,640))
        def frame(image):
            ok,jpeg=cv2.imencode('.jpg',image);assert ok
            return command({'op':'frame','jpeg':base64.b64encode(jpeg).decode('ascii')})
        result=frame(source);assert result['tracked']
        result_wide=frame(cv2.resize(source,(1280,720)));assert result_wide['tracked']
        result_scaled=frame(cv2.resize(source,(2000,1200)));assert result_scaled['tracked']
        print('Neural stdio frame PASS:',result['ms'],'ms (640p, 720p, oversized dynamic scaling)',flush=True)
        if args.virtual:
            assert command({'op':'virtual','enabled':True})['virtual']
            print('Virtual camera sender ACTIVE with fictional input',flush=True)
            until=time.monotonic()+args.seconds
            i=0
            while time.monotonic()<until:
                angle=3*np.sin(i/20)
                matrix=cv2.getRotationMatrix2D((320,320),angle,1)
                frame(cv2.warpAffine(source,matrix,(640,640)));i+=1
            assert command({'op':'virtual','enabled':False})['virtual'] is False
        lost=frame(np.zeros_like(source));assert not lost['tracked']
        print('Lost-face blackout PASS',flush=True)
        command({'op':'stop'});process.wait(timeout=10)
        assert process.returncode==0
        print('Native process shutdown PASS',flush=True)
    finally:
        if process.poll() is None:
            process.terminate()
            try:process.wait(timeout=3)
            except subprocess.TimeoutExpired:process.kill();process.wait()


if __name__=='__main__':
    main()
