# Performance record

The processing probes below use short fictional inputs on Apple M5 / 16 GB.
Live appearance realism remains unfulfilled.

- GhostV2, MPS FP16, restoration off, 720p, 12 measured frames after three warmups:
  mean 51.76 ms / 19.32 FPS, p95 54.78 ms in the earlier optimization comparison.
- GhostV2 with the new XSeg guard, same resolution and restoration off, eight
  measured frames after three warmups: mean 96.4 ms / 10.37 FPS, p95 101.5 ms.
- Separate XSeg-only six-call probes: about 33 ms with CoreML after warmup versus
  about 55 ms on CPU. Combined costs include synchronization and compositing.
- SDXS whole-frame alternative: three MPS FP16 outputs after one warmup averaged
  145.0 ms / 6.9 FPS at 512 square. Eye defects and a blurred lower-strength trial
  failed quality acceptance; this engine was rejected.

Camera acquisition, JPEG transport and conferencing add latency to these values.
An advertised 30 FPS virtual-camera format does not mean 30 completed neural
frames per second. Neither tested path meets smooth full-appearance real-time
acceptance. See NEURAL_RUNTIME.md for reproducibility and model provenance.

Performance capture uses up to 640 pixels wide; other profiles process up to
1280 pixels wide. Auto currently uses Balanced capture limits. There is one
native frame request in flight and no unbounded media queue.

Audio DSP throughput and its estimated 21.33 ms algorithmic window are separate
from physical microphone/output latency. Audible quality, long sessions, thermal
behavior, memory trends and A/V drift need hardware measurements.

## Brief local camera check

With the foreground guard active and restoration off, the packaged app displayed
5.7–6.5 FPS and approximately 128–155 ms neural inference during a brief camera
check. Camera and all outputs were closed with emergency stop; microphone and
virtual output were never started. No camera media was saved or uploaded.
No hand crossing was visible in the inspected frames, so natural hand-occlusion
acceptance remains NOT TESTED. The visible face remained an inner-face patch;
full appearance realism is FAIL. This was not a sustained or conferencing test.
