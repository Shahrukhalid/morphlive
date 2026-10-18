# Compatibility record

Result vocabulary: PASS, FAIL, BLOCKED, NOT TESTED. Workflow instructions do not
count as passing external integration tests.

## Local development runtime

- OS: macOS 26.7.2, Apple Silicon arm64.
- App: unsigned local MorphLive 0.1.0 bundle, Electron 42.11.15 / Chromium 148.
- Camera: physical webcam, 1280 × 720; live capture PASS in a short check.
- Face landmarks: local Google model, CPU worker; face acquisition PASS.
- Persona controls: Atlas, Nova, Ghost linked pitch/formant values observed; PASS.
- Dedicated output window: anonymous avatar canvas received; PASS for window
  reception only. This is not a virtual camera receiver test.
- Microphone: physical input → AudioWorklet → silent AudioContext sink; startup
  and ongoing processing PASS. Audible voice quality NOT TESTED.
- Preferences: quit/relaunch restored the selected Nova persona and voice settings;
  PASS after native persistence fix.
- Emergency stop: camera shutdown and output closure exercised; PASS for observed
  local controls. External receiver freeze behavior NOT TESTED.

## Conferencing acceptance records

- macOS / Zoom: tested version not collected; OBS camera route and BlackHole audio
  route NOT TESTED. Zoom is installed; no completed call acceptance test.
- macOS / Google Meet / Chrome: browser version not collected; OBS / BlackHole
  route NOT TESTED. Permission, synchronization, reconnection tests pending.
- macOS / Google Meet / Edge: version not collected; NOT TESTED.
- macOS / Google Meet / Safari: version not collected; NOT TESTED.
- macOS / Microsoft Teams: version not collected; NOT TESTED.
- macOS / Discord: version not collected; NOT TESTED.
- macOS / OBS 32.1.0: local integration check attempted. OBS displayed a crash-
  recovery prompt, and native source controls could not be operated reliably
  through automation. External virtual-camera reception remains NOT TESTED.
  The clean MorphLive output window itself receives live anonymous frames.
- macOS / BlackHole: BLOCKED for specified route because BlackHole is not installed.
  No driver installation was performed.
- Windows 10/11 / Zoom, Meet, Teams, Discord, OBS: NOT TESTED. Shared code and a
  packaging command exist; Windows hardware/runtime verification is pending.
- Intel macOS: NOT TESTED.

Do not claim universal compatibility. Record exact receiver versions, route,
OS/hardware class, session duration, mute/switching behavior, and observed results
when these tests are actually run. Do not include private device labels or media.
