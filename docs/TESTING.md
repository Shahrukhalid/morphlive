# Testing

Automated: `npm test` checks FFT round trip, pitch frequency and unchanged duration,
formant controls preserving fundamental, silence, mute, clipping, invalid inputs,
rapid changes with bounded buffers, and privacy/security source regressions.
These tests do not establish naturalness, actual device latency, or call quality.
`npm run build` runs strict TypeScript checks and production bundling.
`npm run check:privacy` inspects source and available Git commit diffs for token,
key, personal-path, email, and asset patterns. It does not prove privacy by itself.

Hardware acceptance steps and result vocabulary: PASS, FAIL, BLOCKED, NOT TESTED.

- A Camera: start real webcam, verify moving preview, dimensions, device switching.
- B Tracking: head rotation, eye/mouth motion, occlusion, lighting and reacquisition.
- C Appearance: switch all personas during capture; verify masks track and privacy
  never shows original media when landmarks disappear.
- D Automatic voice: confirm mapped pitch/formant values change with persona;
  disable mapping and verify manual voice remains independent.
- E Voice: speak, listen on headphones, assess clarity, timing, clicks, and pitch.
- F Virtual camera: receive transformed moving feed in an external app through OBS.
- G Virtual microphone: receive transformed speech through a cable in external app.
- H Live switching: change personas during a call; test mute, passthrough, and stop.
- I Long session: at least 30 minutes; record memory, FPS, drop counts, drift, crashes.
- J Recovery: permission denied, hardware unplug/replug, camera busy, sleep/wake,
  output window closed, device removed, model absent/corrupt, and app restart.
- K Resource pressure: verify bounded tracking, Auto profile reduction, timely stop.
- L Privacy: inspect OS network traffic during normal offline processing; no remote
  traffic. Confirm exported diagnostics excludes names, IDs, paths, and media.

Record exact versions, generic hardware class (no serials), performance profile,
route, duration, outcome, and limitation in COMPATIBILITY/IMPLEMENTATION_STATUS.
Keep private faces/voices and personal machine details out of issues and Git.
