# Performance record

Development environment: Apple Silicon arm64 Mac, macOS 26.7.2, Node.js 26.12.0,
Electron 42.11.15 / Chromium 148. Exact chip model and RAM were not collected;
no machine name or serial number is included. These are limited observations,
not a reference-hardware certification.

Observed during short local hardware checks:

- Camera capture: 1280 × 720.
- Face tracking: returned live landmarks in a CPU worker.
- Preview readouts before final frame-pacing adjustment: 25.2–25.9 FPS.
  A later short check after adjustment reported 29.8 FPS at 1280 × 720 while
  face tracking and silent microphone DSP were active. This is not a sustained
  performance certification.
- Renderer readout: approximately 0.1–0.4 ms per canvas effect render. This omits
  camera acquisition, landmark inference, output copies, and receiver latency.
- Microphone pipeline: actual microphone input through AudioWorklet to a silent
  output sink. Estimated internal audio latency readout: 38 ms. It includes a
  21.33 ms algorithmic window plus browser-reported base/output delay. It excludes
  capture-driver latency, external cable/OBS/network/conferencing delays. No
  physical round-trip or audible quality measurement was performed.

Synthetic DSP throughput (`npm run benchmark`): 30 seconds of mono 48 kHz audio
processed in 422 ms after warm-up, real-time factor 0.0141. This is offline
computation throughput, not a real-time callback deadline or voice-quality result.

Targets: lightweight 720p30 preview, bounded tracking, conversational audio, and
stable sessions. Sustained 30 FPS, 1080p, A/V sync tolerance, long-running memory,
callback overruns, and OS thermal behavior have not been validated. Output window
copies target about 15 FPS and require separate OBS receiver measurements.

Performance profile controls request 640-wide, 720p, or 1080p input where the
camera supports it. Auto reduces render resolution when preview throughput falls
below 22 FPS. Tracking inputs are resized to 640 pixels wide. There is only one
tracking bitmap and one acknowledged output frame in flight. CPU landmark
inference is selected explicitly. No GPU acceleration benchmark is claimed.

Repeat measurements on documented reference hardware before a production release.
Use real speech and visible clap tests, profile CPU/GPU and memory for 30 minutes,
and record receiver behavior rather than inferring it from synthetic throughput.
