"""Bounded stdio bridge. One requested frame produces one response; no sockets."""
import base64
import json
import sys
if sys.platform=='darwin':
    # Interactive video work must not inherit a background priority from a
    # conferencing window taking focus. No elevation or system setting change.
    import ctypes
    ctypes.CDLL('/usr/lib/libSystem.B.dylib').pthread_set_qos_class_self_np(0x19,0)
import cv2
import numpy as np
from pathlib import Path
REFERENCE_IDS={item["id"] for item in json.loads((Path(__file__).resolve().parents[1]/"references.json").read_text())}
from images import check_jpeg


def send(value):
    print(json.dumps(value, separators=(',', ':')), flush=True)


def main():
    engine = None
    virtual = None
    last_shape=(512,512,3)
    try:
        while True:
            line = sys.stdin.buffer.readline(1_500_001)
            if not line:
                break
            if len(line) > 1_500_000 or not line.endswith(b'\n'):
                raise ValueError('Oversized bridge request')
            request = json.loads(line)
            op = request.get('op')
            try:
                if op == 'start':
                    reference = request.get('reference')
                    if reference not in REFERENCE_IDS:
                        raise ValueError('Unknown reference')
                    if engine is not None:
                        raise ValueError('Engine already running')
                    backend=request.get('backend','faceswap')
                    if backend=='faceswap':
                        from faceswap import FaceSwapEngine
                        engine=FaceSwapEngine(reference,enhance=request.get('enhance') is True)
                    else:
                        raise ValueError('Unknown neural backend')
                    send({'ok': True, 'device': engine.wrapper.device, 'backend': backend})
                elif op == 'frame' and engine is not None:
                    encoded = request.get('jpeg', '')
                    if not isinstance(encoded, str) or len(encoded) > 1_400_000:
                        raise ValueError('Invalid frame')
                    raw = base64.b64decode(encoded, validate=True)
                    check_jpeg(raw)
                    bgr = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
                    if bgr is None:
                        raise ValueError('Invalid frame decoding')
                    if bgr.shape[0] > 1080 or bgr.shape[1] > 1920:
                        scale = min(1920 / bgr.shape[1], 1080 / bgr.shape[0])
                        bgr = cv2.resize(bgr, (round(bgr.shape[1] * scale), round(bgr.shape[0] * scale)))
                    rgb, ms, tracked = engine.process(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
                    last_shape=rgb.shape
                    if virtual is not None:
                        virtual.send(rgb)
                    ok, jpeg = cv2.imencode('.jpg', cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])
                    if not ok:
                        raise ValueError('Encoding failed')
                    send({'ok': True, 'jpeg':base64.b64encode(jpeg).decode('ascii'),
                          'ms':round(ms, 2), 'tracked':tracked, 'virtual':virtual is not None})
                elif op == 'virtual' and engine is not None:
                    if virtual is not None:
                        virtual.close()
                        virtual = None
                    if request.get('enabled') is True:
                        import pyvirtualcam
                        virtual = pyvirtualcam.Camera(width=last_shape[1], height=last_shape[0], fps=30)
                        virtual.send(np.zeros(last_shape, dtype=np.uint8))
                    send({'ok':True, 'virtual': virtual is not None})
                elif op == 'reference' and engine is not None:
                    engine.set_reference(request.get('reference'))
                    send({'ok':True})
                elif op == 'enhance' and engine is not None:
                    if hasattr(engine, 'set_enhance'):
                        engine.set_enhance(request.get('enhance') is True)
                    send({'ok':True, 'enhanced': getattr(engine, 'restorer', None) is not None})
                elif op == 'stop':
                    send({'ok':True})
                    break
                else:
                    raise ValueError('Unsupported bridge operation')
            except Exception:
                # Do not expose personal paths or raw frames in diagnostics.
                send({'ok':False, 'error':'Neural operation failed. Check local model installation or virtual camera availability.'})
    finally:
        if virtual is not None:
            virtual.send(np.zeros(last_shape, dtype=np.uint8))
            virtual.close()
        if engine is not None:
            engine.close()


if __name__ == '__main__':
    main()
