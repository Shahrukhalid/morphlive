# Compatibility record

Result vocabulary: PASS, FAIL, BLOCKED, NOT TESTED. Workflow instructions do not
count as passing external integration tests.

## Local development runtime

- OS: macOS 26.7.2, Apple Silicon arm64.
- App: unsigned local MorphLive 0.1.0 bundle, Electron 42.11.15 / Chromium 148.
  The project now targets Electron 45; camera and microphone capture on Electron 45
  are NOT TESTED on hardware yet, so the results below apply to Electron 42 only.
- Camera: physical webcam, 1280 × 720; live capture PASS in a short check.
- Face landmarks: local Google model in the native Python engine; fictional-input integration PASS. Natural-motion quality remains unfulfilled.
- Microphone: physical input → AudioWorklet → silent AudioContext sink; startup
  and ongoing processing PASS. Audible voice quality NOT TESTED.
- Preferences: quit/relaunch restored the selected Nova persona and voice settings;
  PASS after native persistence fix.
- Emergency stop: camera shutdown and output closure exercised; PASS for observed
  local controls. External receiver freeze behavior NOT TESTED.

## Conferencing acceptance records

- macOS / Zoom Workplace 7.2.2 (88465): direct neural frames through installed
  OBS Virtual Camera were observed in Video & effects preview, including live
  head-position changes and identity switching. Escape yielded the OBS inactive
  slate. Preview video route PASS; natural-motion/realism acceptance FAIL. Live
  UI varied around 3–9 FPS before later priority/metrics fixes. No meeting was
  joined. Audio route and meeting transmission NOT TESTED.
- macOS / Google Meet / Chrome: browser version not collected; OBS / BlackHole
  route NOT TESTED. Permission, synchronization, reconnection tests pending.
- macOS / Google Meet / Edge: version not collected; NOT TESTED.
- macOS / Google Meet / Safari: version not collected; NOT TESTED.
- macOS / Microsoft Teams: version not collected; NOT TESTED.
- macOS / Discord: version not collected; NOT TESTED.
- macOS / OBS camera extension: the native sender was received in Zoom preview as recorded above. The retired window-capture route is no longer supported.
- macOS / BlackHole: BLOCKED for specified route because BlackHole is not installed.
  No driver installation was performed.
- Windows 10/11 / Zoom, Meet, Teams, Discord, OBS: NOT TESTED. Shared code and a
  packaging command exist; Windows hardware/runtime verification is pending.
- Intel macOS: NOT TESTED.

Do not claim universal compatibility. Record exact receiver versions, route,
OS/hardware class, session duration, mute/switching behavior, and observed results
when these tests are actually run. Do not include private device labels or media.
