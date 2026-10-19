# Windows setup

Windows runtime and packaging verification are pending. This shared code targets
Windows, but Windows 10/11 compatibility must be tested with the chosen Electron
release. Do not treat this document as a completed support certification.

Install Node.js 24+, run `npm ci`, `npm run runtime:install`, optionally
`npm run model:install`, then `npm run build` and `npm run desktop`.
Grant camera and microphone access in Windows Privacy settings. Close other apps
that hold the camera exclusively if capture fails.

Install the native neural runtime and OBS from their official sources, following
NEURAL_RUNTIME.md and pyvirtualcam backend requirements. Keep OBS's own sender
stopped and use MorphLive's Start virtual camera control. Select OBS Virtual
Camera in the conferencing client. This Windows path remains NOT TESTED.
The obsolete output-window route has been removed.

For audio, install VB-CABLE separately under its licensing terms. It can require
administrator approval and restart. Choose CABLE Input as MorphLive's processed
audio output; choose CABLE Output as conferencing microphone. Choose the physical
microphone as MorphLive input. Use matching 48 kHz settings where available.

Run `npm run package:win` on Windows for an unsigned portable executable. Signing,
installer QA, driver verification, Intel/AMD hardware tests, and conferencing tests
are pending. Do not bypass Windows security prompts for untrusted binaries.
