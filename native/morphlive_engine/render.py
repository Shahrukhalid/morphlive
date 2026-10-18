"""Bounded local clip export. No capture, network, or media logging."""
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess as sp
import sys
import tempfile


class Cancelled(Exception):
    pass


def emit(**value):
    print(json.dumps(value), flush=True)


def executable(name):
    found = shutil.which(name)
    if not found:
        found = next((str(p/name) for p in [Path('/opt/homebrew/bin'), Path('/usr/local/bin')] if (p/name).is_file()), None)
    if not found:
        raise ValueError('Install FFmpeg and FFprobe to render local clips.')
    return found


def render(config):
    source, target = Path(config['input']), Path(config['output'])
    if not source.is_file() or target.exists() or target.suffix.lower() != '.mp4':
        raise ValueError('Choose an existing video and a new MP4 output filename.')
    ffmpeg, probe = executable('ffmpeg'), executable('ffprobe')
    metadata = json.loads(sp.check_output([probe, '-v', 'error', '-protocol_whitelist', 'file,pipe', '-show_streams', '-show_format', '-of', 'json', str(source)], timeout=20))
    video = next((s for s in metadata['streams'] if s['codec_type'] == 'video'), None)
    duration = float(metadata.get('format', {}).get('duration', 0))
    if not video or not 0 < duration <= 300:
        raise ValueError('Choose a video up to five minutes long with a known duration.')
    width, height = int(video['width']), int(video['height'])
    rotation = next((abs(int(s.get('rotation', 0))) for s in video.get('side_data_list', []) if 'rotation' in s), 0)
    if rotation % 180 == 90:
        width, height = height, width
    scale = min(1, 1920/width, 1080/height)
    width, height = max(2, int(width*scale)//2*2), max(2, int(height*scale)//2*2)
    numerator, denominator = map(int, video.get('avg_frame_rate', '0/1').split('/'))
    fps = min(30, numerator/denominator) if denominator and numerator else 24
    if fps < 1:
        raise ValueError('Unsupported video frame rate.')
    total = round(duration*fps)
    emit(state='loading', frames=0, total=total)
    from faceswap import FaceSwapEngine, ROOT
    if config.get('restore', True) and not (ROOT/'.runtime/models/ghostv2/restorer.safetensors').is_file():
        raise ValueError('Install the local restoration weights or disable detail restoration.')
    engine = None
    decoder = encoder = None
    try:
        engine = FaceSwapEngine(config['reference'], enhance=config.get('restore', True), quality=True)
        with tempfile.TemporaryDirectory(prefix='.morphlive-render-', dir=target.parent) as folder:
            temporary = Path(folder)/'clip.mp4'
            decoder = sp.Popen([ffmpeg, '-v', 'error', '-nostdin', '-protocol_whitelist', 'file,pipe', '-i', str(source), '-an', '-vf', f'fps={fps},scale={width}:{height}:flags=lanczos,setsar=1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], stdout=sp.PIPE, stderr=sp.DEVNULL)
            encoder = sp.Popen([ffmpeg, '-v', 'error', '-nostdin', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{width}x{height}', '-r', str(fps), '-i', 'pipe:0', '-protocol_whitelist', 'file,pipe', '-i', str(source), '-map', '0:v:0', '-map', '1:a:0?', '-map_metadata', '-1', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(temporary)], stdin=sp.PIPE, stderr=sp.DEVNULL)
            import numpy as np
            count = tracked = 0
            size = width*height*3
            while True:
                data = bytearray()
                while len(data) < size:
                    chunk = decoder.stdout.read(size-len(data))
                    if not chunk:
                        break
                    data.extend(chunk)
                if not data:
                    break
                if len(data) != size:
                    raise ValueError('Video decoding ended with an incomplete frame.')
                result, _, found = engine.process(np.frombuffer(data, dtype=np.uint8).reshape(height, width, 3))
                encoder.stdin.write(result.tobytes())
                count += 1
                if count > 9000:
                    raise ValueError('Clip exceeds the five-minute export limit.')
                tracked += bool(found)
                emit(state='rendering', frames=count, total=total, untracked=count-tracked)
            decoder.stdout.close()
            if decoder.wait(timeout=30) != 0:
                raise ValueError('Video decoding failed.')
            encoder.stdin.close()
            emit(state='encoding', frames=count, total=total, untracked=count-tracked)
            if encoder.wait(timeout=120) != 0 or not tracked:
                raise ValueError('Export failed or no face was detected in the clip.')
            os.chmod(temporary, 0o600)
            # Exclusive atomic publication; an existing output can never be replaced.
            os.link(temporary, target)
            emit(state='completed', frames=count, total=count, untracked=count-tracked)
    finally:
        for process in (decoder, encoder):
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except sp.TimeoutExpired:
                    process.kill()
                    process.wait()
        if engine:
            engine.close()


if __name__ == '__main__':
    os.umask(0o077)
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(Cancelled()))
    try:
        line = sys.stdin.buffer.readline(16385)
        if len(line) > 16384:
            raise ValueError('Invalid export request.')
        render(json.loads(line))
    except Cancelled:
        emit(state='cancelled')
    except ValueError as error:
        # Only our fixed user-facing errors are exposed; upstream errors can contain paths.
        emit(state='failed', error=str(error) if error.__traceback__.tb_next is None else 'Clip rendering failed. Check the local runtime and video format.')
        sys.exit(1)
    except Exception:
        emit(state='failed', error='Clip rendering failed. Check the local runtime and video format.')
        sys.exit(1)
