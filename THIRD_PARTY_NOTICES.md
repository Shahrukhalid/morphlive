# Third-party notices

Original project code and procedural character illustrations: MIT.
No photographs, recordings, external character artwork, or model weights are
committed. Installed dependency distributions retain their original notices.

Runtime dependencies:

- React and React DOM 19.0.0, including scheduler: MIT.
  https://github.com/facebook/react/blob/main/LICENSE
- Lucide React 0.468.0: ISC. https://lucide.dev/license
- MediaPipe Tasks Vision 0.10.32 and its packaged WASM runtime: Apache-2.0.
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
