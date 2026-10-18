"""Explicit optional download. Installs locally; never starts capture devices."""
import hashlib
from pathlib import Path
import subprocess
import sys
import ssl
import urllib.request
import venv

ROOT = Path(__file__).resolve().parents[1]
SOURCE = '9b294b3d0536135442ea73cb01e6cb3ca7029dd3'
WEIGHTS = '82a4fa6735ca58432b6ce39301b4b9ee066dea47'
MODELS = {
    'base_models/appearance_feature_extractor.pth':'5279bb8654293dbdf327030b397f107237dd9212fb11dd75b83dfb635211ceb5',
    'base_models/motion_extractor.pth':'251e6a94ad667a1d0c69526d292677165110ef7f0cf0f6d199f0e414e8aa0ca5',
    'base_models/spade_generator.pth':'4780afc7909a9f84e24c01d73b31a555ef651521a1fe3b2429bd04534d992aee',
    'base_models/warping_module.pth':'2f61a6f265fe344f14132364859a78bdbbc2068577170693da57fb96d636e282',
    'retargeting_models/stitching_retargeting_module.pth':'3652d5a3f95099141a56986aaddec92fadf0a73c87a20fac9a2c07c32b28b611'
}


def digest(file):
    with file.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    if sys.version_info[:2] != (3, 11):
        raise SystemExit('Use Python 3.11 for this pinned experimental runtime.')
    runtime = ROOT/'.runtime/vendor/LivePortrait'
    runtime.parent.mkdir(parents=True, exist_ok=True)
    if not runtime.exists():
        subprocess.run(['git','clone','https://github.com/KlingAIResearch/LivePortrait.git',str(runtime)], check=True)
        subprocess.run(['git','-C',str(runtime),'checkout','--detach',SOURCE], check=True)
    actual = subprocess.check_output(['git','-C',str(runtime),'rev-parse','HEAD'], text=True).strip()
    if actual != SOURCE:
        raise SystemExit('Existing LivePortrait checkout differs from the pinned source; inspect it manually.')
    env = ROOT/'.venv'
    if not env.exists():
        venv.create(env, with_pip=True)
    python = env/('Scripts/python.exe' if sys.platform=='win32' else 'bin/python')
    subprocess.run([str(python),'-m','pip','install','-r',str(ROOT/'native/requirements.txt')], check=True)
    trust=subprocess.check_output([str(python),'-c','import certifi;print(certifi.where())'],text=True).strip()
    context=ssl.create_default_context(cafile=trust)
    for name, expected in MODELS.items():
        target = runtime/'pretrained_weights/liveportrait'/name
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and digest(target)==expected:
            continue
        temporary = target.with_suffix('.download')
        url = f'https://huggingface.co/KlingTeam/LivePortrait/resolve/{WEIGHTS}/liveportrait/{name}'
        print('Downloading', name, flush=True)
        try:
            with urllib.request.urlopen(url,context=context) as response,temporary.open('wb') as out:
                import shutil
                shutil.copyfileobj(response,out)
            if digest(temporary)!=expected:
                raise RuntimeError('Model checksum mismatch: '+name)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
    print('Local neural models installed. Run npm run model:install for cropping.')
    print('Import adult reference images in the app. No image or voice is downloaded by this installer.')


if __name__ == '__main__':
    main()
