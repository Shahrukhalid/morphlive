# Release milestones

1. Local engine baseline: source camera/audio pipelines, tracking, original
   effects, DSP, editable linked personas, emergency stop, and offline shell.
2. Runtime acceptance: physical camera/microphone, audible quality, permissions,
   tracking under different lighting, output window, and device hot-plugging.
3. External integration: verify OBS, virtual audio, Zoom, Meet, and Teams on each
   intended OS. Record exact app versions and actual results.
4. Reliability: 30-minute sessions, sleep/wake, minimized windows, disconnects,
   overload, privacy traffic audit, drift measurements, and recovery.
5. Distribution: Windows and Intel Mac builds; minimum OS and hardware validation;
   accessibility review; license audit of actual packaged binaries; signing and
   notarization; reproducibility and clean-machine install checks.
6. Production release only after acceptance gates pass. Native virtual-device
   backends, optional heavier models, and neural voice conversion remain separate
   future capabilities rather than promises of this preview.

The source repository may be public as an experimental preview under the user's
explicit publication instruction. Do not publish binaries as production-ready
until the gates above pass. Keep implementation status and compatibility records
accurate; NOT TESTED never means PASS.
