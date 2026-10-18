# Architecture

Electron serves a packaged React/TypeScript renderer from `morph://studio`.
It uses a sandboxed, isolated renderer with no Node access. A narrow preload
exposes only load/save of schema-validated preferences at one fixed app-data file.
It does not accept paths, commands, or device/media data.
The custom protocol only resolves files inside dist. Network requests outside
local packaged schemes are blocked by the Electron session and renderer CSP.

Video: getUserMedia → HTMLVideoElement → Canvas effect → preview canvas.
A module worker uses MediaPipe Face Landmarker in VIDEO mode. One resized
ImageBitmap is transferred at a time, with no frame queue. The worker closes
input bitmaps. Results expire after 400 ms; a stalled worker is terminated after
2.5 seconds. Landmark detection runs at about 10–15 Hz; rendering targets 30 FPS.
CPU inference avoids unsupported GPU-worker assumptions. Procedural avatars
track facial center, eye openness, mouth opening, and eye-line rotation.

Output: preview canvas → bounded ImageBitmap copy → BroadcastChannel → separate
output canvas. Output targets about 15 FPS and blacks out after 1.2 seconds
without a new frame. OBS captures only this window. There is no native camera
extension or DirectShow/Media Foundation driver in the project.

Audio: getUserMedia → AudioContext at 48 kHz → AudioWorkletNode → configurable
DelayNode → selected physical or virtual audio sink. The DSP uses a 1024-point
FFT, 256-sample hop, Hann analysis/synthesis windows, phase-based instantaneous
frequencies, pitch-bin remapping, and smoothed spectral-envelope correction.
This approximates independent pitch/formant adjustment; it does not replicate
neural voice conversion. FFT and overlap buffers are preallocated and fixed.
Parameter transitions are smoothed; each 128-frame render quantum writes exactly
128 output samples. Robot effects use ring modulation. A soft gate and final
ceiling prevent excessive output. There is no neural denoising or compressor.

Persona selection updates visual ID and voice parameters in one React state
operation. DSP receives updated parameters asynchronously and ramps them. These
are not sample-accurate synchronized commits across camera and audio clocks.
Manual audio offset is implemented; automatic clock synchronization and drift
correction are not. Audio latency includes algorithm delay, AudioContext-reported
base/output latency, and configured delay. It excludes capture-driver, OBS,
virtual-device, network, and conferencing latency.

Settings use a validated allowlist, localStorage, and a schema-validated atomic
native preferences file in the OS app-data directory. Device IDs and labels are not
persisted. Capture generation tokens prevent delayed permission results from
restarting stopped pipelines. Emergency stop cancels animation, terminates the
worker, closes tracks and audio context, and closes the projector.

Directory responsibilities:

- apps/desktop/electron: local protocol, window security, OS permissions.
- apps/desktop/src/video: worker tracking and modular mode renderer.
- apps/desktop/src/audio: platform audio graph and standalone testable DSP.
- apps/desktop/src/presets.ts: original character and voice settings schema.
- apps/desktop/src/App.tsx: studio, settings, device control, lifecycle, projector.
- scripts: model verification, privacy audit, license inventory, synthetic benchmark.
- tests: DSP invariants and privacy/security regression checks.

Further modularization of the UI/controller and native device backends is planned
before production stabilization. Electron was selected for dependable shared
Chromium media/AudioWorklet behavior and explicit sink routing rather than adding
unverified native capture bindings in this first milestone.
