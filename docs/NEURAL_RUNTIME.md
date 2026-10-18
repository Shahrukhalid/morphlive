# Native neural runtime

This work is experimental. It does not yet meet the requested realistic,
real-time face replacement and matched voice acceptance criteria.

The default neural engine uses the BSD-licensed GhostV2 generator and MIT CVLFace
identity model. It replaces the tracked face inside the incoming camera frame,
retaining the room, body, and hair. MediaPipe provides alignment; source identity
embeddings are cached once, so the recognizer is not run on every video frame.
Installed identities can switch during capture. No InsightFace weights are used.
Voice pairing uses the existing DSP; there is no neural voice conversion.

The alternative MIT LivePortrait mode animates a square reference portrait. It
is substantially slower and does not replace a face inside the original scene.

## Current evidence

- GhostV2, Apple M5 / 16 GB, PyTorch 2.9.1 MPS FP16, eight fictional-input frames
  after two warmups: mean 71.0 ms, p95 75.4 ms, 14.09 FPS. Visual inspection
  confirmed a photorealistic face within the fictional input frame. These are
  short synthetic-input measurements, not sustained camera-to-call results.
- Packaged desktop app → OBS Virtual Camera → Zoom Workplace 7.2.2 (88465):
  transformed live camera frames and head-position changes were observed in
  Zoom Video & effects preview. Live identity switching and generic voice
  parameter changes were exercised. Escape stopped output; Zoom displayed the
  OBS inactive-camera slate. No meeting was joined or recorded.
- The live application varied around 3–9 FPS before the later priority/metrics
  fixes. This does not meet natural-motion acceptance criteria. Face boundaries
  and facial-hair remnants remain visible. Do not describe it as indistinguishable.
- Optional GFPGAN v1.4 full-precision restoration: two fictional-input frames
  after two warmups measured mean 213.3 ms, p95 217.3 ms, 4.69 FPS. Still-frame
  detail improved; this does not establish live realism. Half precision produced
  visibly poor output and was rejected for the restoration model.

- Apple M5 / 16 GB, PyTorch 2.9.1 MPS, eight fictional-input frames after two
  warmups: mean 669.0 ms, p95 692.2 ms, 1.49 FPS. This is model timing, not
  camera-to-call latency. Visual inspection found severe vertical artifacts:
  quality FAIL for that initial path. Moving 5-D sampling to CPU removed the
  artifact; the corrected portrait mode measured 1.31 FPS. It is too slow for calls.
- Direct pyvirtualcam → installed OBS virtual camera: three synthetic frames
  sent and device closed successfully. This is sender verification only.
- Zoom meeting transmission, Meet/Teams reception, robust facial-motion fidelity,
  lip fidelity, exact voice matching, and sustained load: NOT TESTED.

## Explicit local installation

Python 3.11 and Git are required. From the source project:

```sh
python3.11 scripts/install-faceswap.py --restore
npm run model:install
# Optional, explicit public actor photo download:
.venv/bin/python scripts/install-actor-references.py
# Optional slow portrait-animation backend:
python3.11 scripts/install-neural.py
```

The installer pins the upstream source commit and model revision, verifies all
model SHA-256 digests, installs Python dependencies in `.venv`, and places
weights in ignored `.runtime`. These dependencies are separate from npm's audit
and source CI. Camera and microphone do not start during installation.

In the desktop app choose the project with **Choose runtime folder**, then
**Import local reference**. Two entirely fictional adult source portraits were
generated for local development; they are private runtime inputs and are not
published. A new checkout requires its own reference images.

The catalog contains two fictional adult slots plus five actors and five
actresses. This is a curated selection, not an authoritative 2026 ranking.
Optional reference photographs are downloaded explicitly from Wikimedia Commons
under the licenses in `native/actor-references.json`; checksums are verified.
Photo attribution, license information, and complete source URLs appear in the
reference-credit panel and public manifest. Native video contains no forced
branding or text overlay. Preserve required photo attribution when sharing
derived media. Share-alike photos
retain their license requirements. No endorsement or consent by the pictured
actor is claimed. Imported replacement photos retain their own terms.
An unavailable entry says **local reference needed**. No actor voice recording
is included; suggested pitch/formant settings are generic DSP.

Use even frontal lighting. Portrait-animation mode also offers **Recalibrate
neutral pose** to reset its driving baseline. Face-swap mode has an optional
**Face detail restoration** setting, available after installing its model; it
substantially reduces speed. Balanced/Quality capture retains up to 1280 pixels
wide; Performance uses up to 640. Both video JPEG passes use higher quality
settings than the first prototype. The bridge has one frame in flight, bounded JSON
messages, no socket, no recordings, no media logs, and no runtime downloads.
Stop before switching modes or runtime. Cached references can switch live. Escape closes the process
and capture tracks. Additional device failure scenarios still need testing.

## Direct virtual camera

Install and activate the official OBS camera extension separately. pyvirtualcam
supports OBS 30+ on macOS 13+; the extension must be activated first. Keep OBS's
own virtual camera stopped while Python sends. Start neural capture, then
**Start virtual camera**, and select **OBS Virtual Camera** in the receiving
application. This carries video only. Voice still needs the separate installed
virtual audio route described in VIRTUAL_MICROPHONE.md.

The camera advertises 30 FPS but only receives completed neural frames. It does
not make the neural engine run at 30 FPS. Never infer actual speed from the
camera's advertised format.

## Sources and licenses

- [GhostV2](https://github.com/dimitribarbot/ghostv2), source commit
  `bc53ed086dbe8ea38e165aec7aaac90d1749a335`, BSD-3-Clause generator and source.
  The author identifies its CVLFace identity model as MIT. The original
  InsightFace/ArcFace weights are not selected or downloaded.

- [Official LivePortrait source](https://github.com/KlingAIResearch/LivePortrait)
  at `9b294b3d0536135442ea73cb01e6cb3ca7029dd3`, MIT.
- [Official human weights and model card](https://huggingface.co/KlingTeam/LivePortrait)
  at `82a4fa6735ca58432b6ce39301b4b9ee066dea47`, marked MIT.
- [pyvirtualcam documentation](https://github.com/letmaik/pyvirtualcam), GPL-2.0.
  It is an optional separately installed Python dependency and is not included
  in the MIT application package. Review distribution obligations before
  bundling a native runtime.

All weights, imported references, the Python environment, logs, and generated
packages stay outside Git. No contributor/co-author identities are added by
runtime installation.
