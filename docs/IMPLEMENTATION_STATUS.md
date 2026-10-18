# Implementation status

Version 0.1.0 is an experimental preview, not a completed production application.

## Implemented and checked

- Strict TypeScript production build: PASS.
- Thirteen automated audio/security/privacy regression checks: PASS.
- Clean locked dependency reinstall and repeat test/build: PASS on macOS arm64.
- Dependency audit after downloader override: zero reported vulnerabilities.
- Unsigned arm64 .app packaging and local application launch: PASS.
- Actual webcam capture at 1280 × 720: PASS in short local runtime check.
- Local MediaPipe CPU worker face acquisition: PASS after classic-worker fix.
- Original procedural masks, avatar/privacy output, and persona switching: source
  implemented; tracked runtime and linked parameter changes exercised.
- Atlas/Nova/Ghost linked voice settings: PASS for observed UI parameter mapping.
- Physical microphone → AudioWorklet → silent output sink: PASS for startup and
  ongoing processing. Estimated internal audio delay readout: 38 ms.
- Pitch changes with preserved duration, independent envelope control, exact mute,
  output ceiling, finite samples, and fixed DSP buffers: automated checks PASS.
- Dedicated anonymous output window: PASS for local canvas reception.
- Local emergency stop: camera/output shutdown exercised.
- Source privacy scan: PASS; no private media or model weights selected for Git.
- Public source publication authorized explicitly by the user. Only the new
  morphlive repository is within publication scope.

## Implemented with partial verification

- Manual voice override, gating, robot tone, smoothed transitions, custom presets,
  model checksum verification, and diagnostics. Native preferences have bounded
  schema validation and atomic writes. Actual quit/relaunch restored Nova and its
  pitch/formant values: PASS after correcting startup sender validation.
- Device enumeration, permissions, generation-based cancellation, stop recovery,
  tracking timeout, stale landmark expiry, and Auto resolution fallback.
- Output window uses one acknowledged frame in flight and a stale-feed blackout.
- Manual additional audio delay is implemented. True shared A/V clocks, drift
  detection/correction, and sample-accurate persona changes are not implemented.
- Canvas 2D compositing and CPU landmark inference are used. GPU-backed rendering
  may occur inside Chromium but no GPU model acceleration or benchmark is claimed.

## NOT TESTED or BLOCKED

- Audible transformed speech naturalness, intelligibility, clicks and actual
  end-to-end latency: NOT TESTED. Silent processing is not a listening test.
- External OBS virtual-camera reception: NOT TESTED.
- BlackHole microphone route: BLOCKED; driver absent. No installation attempted.
- Zoom, Meet, Teams, Discord call acceptance: NOT TESTED.
- Sustained 720p30, 1080p, 30-minute memory/drift tests: NOT TESTED.
- Hot unplug/reconnect, OS sleep/wake, permissions revoked mid-call, resource
  pressure, missing/corrupt model recovery: NOT TESTED beyond code-path checks.
- Network traffic inspection during a complete offline session: NOT TESTED.
  Source checks and request blocking are implemented, not a traffic audit result.
- Windows runtime/build, Intel Mac runtime/build, minimum OS versions: NOT TESTED.
- Signed/notarized distribution, accessibility audit, clean-machine installation:
  NOT TESTED. Local bundle is unsigned and uses a default application icon.

## Known limitations

- Main preview briefly measured about 25–26 FPS before final scheduling adjustment
  and 29.8 FPS afterward; no sustained 30 FPS claim. Output copies target about 15 FPS.
- Formant control is a spectral-envelope approximation. Phase-vocoder artifacts
  may occur, especially at extreme settings. No neural voice conversion exists.
- Non-privacy masks can reveal original camera when tracking is lost. Use the
  full-frame Ghost privacy mode for anonymous output.
- One audio output sink; simultaneous monitoring needs external OS routing.
- External receivers can retain a previous frame after local stop.
- No realistic likeness replacement, background segmentation, native virtual
  camera/microphone driver, neural noise suppression, or automatic driver install.
- No production-quality claim until the release acceptance gates are complete.

## Next work

1. Listen with headphones and validate voice behavior with real speech.
2. Verify OBS capture and install a chosen virtual audio device manually.
3. Execute exact-version Zoom/Meet/Teams call and synchronization tests.
4. Run 30-minute profiling, device failure, overload, and privacy traffic tests.
5. Validate Windows/Intel targets and signing/distribution requirements.
6. Complete UI/controller modularization, accessibility, and packaged license QA.
