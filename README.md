<div align="center">

# MorphLive

### Experimental prototype — original goal not achieved.

Local camera and voice-effects research. Community help welcome.

![Status: goal not achieved](https://img.shields.io/badge/status-goal_not_achieved-orange)
![License: MIT](https://img.shields.io/badge/license-MIT-84e7cf)
![Local first](https://img.shields.io/badge/processing-on_device-84e7cf)

</div>

**Website: <https://shahrukhalid.github.io/morphlive/>**

> **Project status — original goal not achieved (20 October 2026).**
>
> MorphLive has **not delivered convincing, realistic, real-time full-appearance
> transformation** on the tested free/local Mac setup. This repository remains
> public as an experimental code and research record, not a finished or
> production-ready product.
>
> The current live engine replaces inner facial features; hair, outer beard and
> head shape remain original. The brief guarded camera check ran around 6 FPS.
> The whole-frame replacement candidate also failed visual quality and speed
> acceptance. Passing code tests does not establish realism or reliable video-call
> compatibility. See [measured limitations](docs/PERFORMANCE.md) and
> [the rejected whole-frame experiment](https://github.com/Shahrukhalid/morphlive/pull/9).

## Help us achieve the original goal

**Contributors and researchers are welcome.** The goal is still realistic live
appearance changes that follow the user's expressions and movements, including
hair, beard and head shape, while correctly preserving hands and other foreground
objects. The primary target is **free, local processing on Apple Silicon with 16 GB memory**, followed by verified virtual-camera delivery to video-call apps.
Video is the current priority; existing voice controls are generic DSP effects.

Help is especially useful with:

- A suitable whole-head video model or engine, with clear model/asset licenses.
- Core ML, Metal or MLX implementations that improve completed-frame throughput
  without sacrificing natural texture, expression transfer or temporal stability.
- Reliable foreground segmentation and hand-occlusion handling.
- Reproducible latency, memory and received-video tests for Zoom, Meet or other
  video apps through a virtual camera.

Please [open an issue](https://github.com/Shahrukhalid/morphlive/issues) with a
concrete proposal, or submit a focused pull request. Include the model/license,
minimum hardware, memory use, completed generated FPS and latency, test method,
and known limitations. Clearly state if a proposal needs paid services, cloud
processing or different hardware. Use fictional or consenting adult test subjects;
never publish private media or credentials. See [contribution guidance](CONTRIBUTING.md).
No engine or future performance is promised until it passes measured acceptance.
