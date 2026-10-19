"""Install the optional BSD/MIT face-swap runtime, with pinned model hashes."""
import hashlib
import argparse
from pathlib import Path
import subprocess
import sys
import ssl
import urllib.request
import venv

ROOT=Path(__file__).resolve().parents[1]
SOURCE='bc53ed086dbe8ea38e165aec7aaac90d1749a335'
MODELS={
    'generator.safetensors':('GhostV2_G_unet_2blocks.safetensors','6e45013c280f0afb7ad2760e6d2f80f4e754e6f4096f11edf0faf8dec29f4c22'),
    'recognizer.safetensors':('cvlface_adaface_vit_base_webface4m.safetensors','5fafd6b7d599a3ede5fac5bd1d01ad05e9e93e89b39b7687d4a3bc93ff2aebc0')
}


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--restore',action='store_true',help='Also download the slower optional face detail model');parser.add_argument('--occlusion',action='store_true',help='Install the separately licensed GPL-3.0 XSeg foreground guard');args=parser.parse_args()
    if sys.version_info[:2]!=(3,11):
        raise SystemExit('Use Python 3.11 for this experimental runtime.')
    vendor=ROOT/'.runtime/vendor/ghostv2'
    vendor.parent.mkdir(parents=True,exist_ok=True)
    if not vendor.exists():
        subprocess.run(['git','clone','https://github.com/dimitribarbot/ghostv2.git',str(vendor)],check=True)
        subprocess.run(['git','-C',str(vendor),'checkout','--detach',SOURCE],check=True)
    if subprocess.check_output(['git','-C',str(vendor),'rev-parse','HEAD'],text=True).strip()!=SOURCE:
        raise SystemExit('Existing GhostV2 source differs from the pinned revision; inspect it manually.')
    env=ROOT/'.venv'
    if not env.exists():
        venv.create(env,with_pip=True)
    python=env/('Scripts/python.exe' if sys.platform=='win32' else 'bin/python')
    subprocess.run([str(python),'-m','pip','install','-r',str(ROOT/'native/requirements.txt')],check=True)
    trust=subprocess.check_output([str(python),'-c','import certifi;print(certifi.where())'],text=True).strip()
    context=ssl.create_default_context(cafile=trust)
    models=ROOT/'.runtime/models/ghostv2'
    models.mkdir(parents=True,exist_ok=True)
    if args.restore:
        MODELS['restorer.safetensors']=('GFPGANv1.4.safetensors','63cc6c4625d3901fedffab4889a6adb0b4f42d5c8a968cf2429592932c1132d3')
    for name,(remote,sha) in MODELS.items():
        target=models/name
        if target.exists() and digest(target)==sha:
            continue
        temporary=target.with_suffix('.download')
        print('Downloading',name,flush=True)
        try:
            with urllib.request.urlopen('https://github.com/dimitribarbot/ghostv2/releases/download/v1.0.0/'+remote,context=context) as response,temporary.open('wb') as out:
                import shutil
                shutil.copyfileobj(response,out)
            if digest(temporary)!=sha:
                raise RuntimeError('Model checksum mismatch: '+name)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
    if args.occlusion:
        folder=ROOT/'.runtime/models/occlusion';folder.mkdir(parents=True,exist_ok=True)
        target=folder/'xseg_3.onnx';sha='48ccd7e8541e159a5a754ec9e62df2f12065f7df8f9af842c1750342c6533559'
        if not target.exists() or digest(target)!=sha:
            temporary=target.with_suffix('.download')
            try:
                with urllib.request.urlopen('https://github.com/facefusion/facefusion-assets/releases/download/models-3.2.0/xseg_3.onnx',context=context) as response,temporary.open('wb') as out:
                    import shutil
                    shutil.copyfileobj(response,out)
                if digest(temporary)!=sha:raise RuntimeError('Occlusion model checksum mismatch')
                temporary.replace(target)
            finally:temporary.unlink(missing_ok=True)
    print('Face-swap runtime installed locally. Run npm run model:install for landmarks.')
    print('Import an adult reference you have permission to transform. No capture was started.')


if __name__=='__main__':
    main()
