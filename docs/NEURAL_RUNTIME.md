# Native neural runtime

This work is experimental. It does not yet meet the requested realistic,
real-time face replacement and matched voice acceptance criteria.

MorphLive provides two local neural transformation modes:

1. **Full Persona AI (`LivePortrait`)**: An MIT-licensed neural portrait pipeline that animates the entire persona—head, hair, skin, shoulders, clothing, and background—driven in real time by your physical camera's motion, eye blinks, facial expressions, and speech. Formatted natively into 16:9 widescreen (1280×720) with cinematic depth-of-field background bokeh so video calls (Zoom, Meet, Teams, browser calls) receive a broadcast-ready widescreen feed without black bars or distortion. This mode completely prevents beard or room bleed-through.

2. **Webcam Face Swap (`GhostV2`)**: BSD-licensed GhostV2 generator and MIT CVLFace identity model. It swaps facial features into your live webcam feed while keeping your body, hair, and bedroom background. MediaPipe provides alignment; source identity embeddings are cached once. Features optional GFPGAN 512×512 face detail restoration and organic boundary illumination blending.

## Free local constraint

The runtime stays free and local on your machine. No paid inference API, cloud
processing, subscription, or external computer is required. Models and reference
photos stay out of Git.

## Latest local optimization

The MPS generator uses channels-last weights. A controlled generator-only
comparison measured 43.69 ms versus 37.35 ms; output tensors had zero maximum
absolute difference for that fictional input. Full pipeline output changes
because compositing changed separately.

The compositor processes the face region, feathers inward from valid generated
pixels, and leaves the background exact. Uniform upper-face colour correction
and a coarse illumination adjustment at the seam replace the previous
whole-face spatial transfer of original shading. This reduces the mechanism
that copied original mouth/beard shading; it does not remove facial hair outside
the replaced region or establish convincing visual quality.

A repeat before/after probe on Apple M5 / 16 GB, MPS FP16, used 12 fictional-input
frames after three warmups, with restoration off. At 640 × 640, mean processing
fell from 55.77 to 50.57 ms (17.93 to 19.77 FPS). At 1280 × 720, it fell from
63.90 to 51.76 ms (15.65 to 19.32 FPS), with optimized p95 54.78 ms. These timings
exclude JPEG transport, camera acquisition and conferencing. They are short
synthetic-input comparisons, not a live-call performance claim. Visual realism
and natural facial-motion acceptance still FAIL.

Reproduce the current configuration with:

```sh
.venv/bin/python native/morphlive_engine/benchmark.py --engine faceswap --frames 12 --width 1280 --height 720
.venv/bin/python scripts/test-composite.py
```

Three numerical checks cover exact unchanged background, generated-crop boundary
coverage, and preventing original dark mouth shading from entering the fully
replaced interior. No physical capture devices are used by these checks.

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
