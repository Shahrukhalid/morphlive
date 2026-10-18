"""Explicit public photo download. Credits/licenses accompany installed references."""
import hashlib
import json
from pathlib import Path
import ssl
import sys
import urllib.request
import certifi

ROOT=Path(__file__).resolve().parents[1]


def main():
    references=json.loads((ROOT/'native/actor-references.json').read_text())
    destination=ROOT/'.runtime/references'
    destination.mkdir(parents=True,exist_ok=True)
    context=ssl.create_default_context(cafile=certifi.where())
    for item in references:
        target=destination/(item['id']+'.png')
        if target.exists():
            if hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']:
                continue
            print('Preserving custom local reference:',item['id'])
            continue
        request=urllib.request.Request(item['url'],headers={'User-Agent':'MorphLiveLocalReferenceInstaller/0.1 (https://github.com/Shahrukhalid/morphlive)'})
        with urllib.request.urlopen(request,context=context,timeout=60) as response:
            raw=response.read(10_000_001)
        if len(raw)>10_000_000 or hashlib.sha256(raw).hexdigest()!=item['sha256']:
            raise RuntimeError('Photo size or checksum mismatch: '+item['id'])
        target.write_bytes(raw)
        target.chmod(0o600)
        print(item['id']+' — '+item['credit']+' — '+item['license'])
    print('Installed photos stay local. Photo credits and licenses are available in the app and manifest.')
    print('These photos do not indicate the subjects endorse or consent to the application.')


if __name__=='__main__':
    main()
