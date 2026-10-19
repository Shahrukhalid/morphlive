# Third-party notices

Original project application code: MIT.
No photographs, recordings, external character artwork, or model weights are
committed. Installed dependency distributions retain their original notices.

Runtime dependencies:

- React and React DOM 19.0.0, including scheduler: MIT.
  https://github.com/facebook/react/blob/main/LICENSE
- Lucide React 0.468.0: ISC. https://lucide.dev/license
- The separately installed native MediaPipe 0.10.35 runtime: Apache-2.0.
  https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE
- Electron: MIT, with Chromium and other component notices distributed in the
  Electron application. https://github.com/electron/electron/blob/main/LICENSE

Build tooling (Vite, TypeScript, electron-builder and dependencies) retains its
own licenses. `npm run licenses` inventories installed production packages; it
does not replace a full bundled-binary license audit. Preserve Electron's LICENSE
and LICENSES.chromium.html in any packaged distribution.

The optional Google MediaPipe Face Landmarker model is downloaded separately,
checksum verified, and excluded from Git. Review its upstream model card and
terms before distributing local packages containing it:
https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker

External integrations are not bundled or modified:

- OBS Studio is GPL-2.0-or-later: https://github.com/obsproject/obs-studio
- BlackHole is GPL-3.0 with upstream commercial integration terms:
  https://github.com/ExistentialAudio/BlackHole
- VB-CABLE is separately licensed proprietary software:
  https://vb-audio.com/Services/licensing.htm

MorphLive captures its own output window through OBS and sends audio to an
installed OS audio endpoint. It does not link, embed, redistribute, or rename
these drivers. No claim of endorsement or affiliation is made.

## Optional native neural runtime

GhostV2 source and generator are BSD-3-Clause; its selected CVLFace ViT identity
model is identified as MIT by the publisher. Optional GFPGAN v1.4 face restoration is Apache-2.0. MediaPipe and PyTorch retain their upstream licenses. The optional
pyvirtualcam package is GPL-2.0 and is installed separately. No native Python
dependencies, model weights, or source reference photos are bundled in this
repository or the Electron package. Read docs/NEURAL_RUNTIME.md before bundling
a native runtime.

Optional public actor photo URLs, authors, individual Creative Commons licenses,
and digests are in native/actor-references.json. These are public source credits,
not application contributors. Credited, disclosed transformations do not imply
endorsement by the people pictured.

The optional XSeg-3 model is hosted by FaceFusion, whose model metadata lists it
as GPL-3.0. It is downloaded separately with a pinned SHA-256; neither the model
weights nor FaceFusion application source are included in the app or repository.
The optional ONNX Runtime library retains its MIT license.
