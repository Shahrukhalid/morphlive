# Changelog

## Unreleased

- Media permission requests now deny instead of hanging if the macOS camera or
  microphone prompt fails.
- A failed switch away from a virtual camera now reports an error instead of
  rendering from an already stopped stream.
- Starting audio again releases any previous microphone track and AudioContext.
- One malformed saved custom preset no longer resets every saved setting.
- Startup failures show an error and exit instead of leaving a windowless process.
- Packaged builds disable the run-as-Node, `NODE_OPTIONS` and inspector fuses.
- Node.js 24 is declared as the minimum supported version.

## 0.1.0 — experimental preview

- Added local Electron studio with explicit media capture and routing controls.
- Added optional worker-based face landmarks and six original character pairings.
- Added streaming pitch/formant-envelope DSP and editable voice mappings.
- Added OBS output window, output sink selection, emergency stop, and diagnostics.
- Added source privacy checks, audio tests, CI, setup guides, and acceptance plans.
- Hardware and external-call validation remain pending; see implementation status.
