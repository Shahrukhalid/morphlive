# Implementation status

Version 0.1.0 is an experimental preview, not a completed production application.

## Implemented and checked

- Optional real GhostV2 face replacement and cached source switching: functional
  native probe PASS for all 12 installed references and lost-face blackout.
- Zoom Workplace 7.2.2 preview received transformed live frames via OBS Virtual
  Camera. Native Escape stop yielded the inactive OBS slate. This is a preview
  result, not a completed meeting/audio acceptance test.
- Visual realism and smooth movement acceptance: FAIL. The current model still
  exposes seams and facial-hair remnants; it is not indistinguishable. See
  NEURAL_RUNTIME.md for separate synthetic-input and live timing evidence.

- Free local Mac optimization: channels-last MPS generator and face-region
  compositing implemented. Latest short 720p fictional-input comparison measured
  19.32 FPS versus 15.65 FPS before the change, excluding transport and camera.
  Three numerical compositor checks PASS; live quality remains unaccepted.
- Strict TypeScript production build: PASS.
- Seventeen automated audio/native-bridge/security/privacy regression checks: PASS.
- Clean locked dependency reinstall and repeat test/build: PASS on macOS arm64.
- Dependency audit after downloader override: zero reported vulnerabilities.
- Main-branch GitHub CI tests, source build, privacy scan, license inventory, and
  dependency audit: PASS on macOS and Windows hosted runners for the earlier
  procedural implementation. The initial neural prototype at `2dd18ee` also
  passed both runners. Native model inference is not exercised by source CI. This is not hardware support
  certification. A public Dependabot signature false positive was corrected.
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
- Dedicated anonymous output window: PASS for local canvas reception after the
  readiness handshake fix. Escape in the projector closed capture/output: PASS.
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
- The original procedural renderer uses Canvas 2D and CPU landmark inference.
  The separate neural sidecar uses PyTorch MPS on the tested Mac; its measured
  timing and quality limits are documented in NEURAL_RUNTIME.md.

## NOT TESTED or BLOCKED

- Audible transformed speech naturalness, intelligibility, clicks and actual
  end-to-end latency: NOT TESTED. Silent processing is not a listening test.
- Earlier OBS window-capture setup: NOT TESTED due to crash recovery. The later
  direct native sender was observed in Zoom preview; meeting transmission remains
  NOT TESTED.
- BlackHole microphone route: BLOCKED; driver absent. No installation attempted.
- Zoom/Meet/Teams/Discord meeting acceptance: NOT TESTED. Zoom video preview
  reception alone passed.
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
- Neural face replacement is experimental and limited to the face region; hair,
  body, and room remain original. No background segmentation, bundled virtual
  driver, neural noise suppression, or automatic driver installation.
- No production-quality claim until the release acceptance gates are complete.

## Next work

1. Listen with headphones and validate voice behavior with real speech.
2. Verify OBS capture and install a chosen virtual audio device manually.
3. Execute exact-version Zoom/Meet/Teams call and synchronization tests.
4. Run 30-minute profiling, device failure, overload, and privacy traffic tests.
5. Validate Windows/Intel targets and signing/distribution requirements.
6. Complete UI/controller modularization, accessibility, and packaged license QA.
