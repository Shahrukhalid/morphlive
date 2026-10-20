<div align="center">

# MorphLive

### Experimental prototype — original goal not achieved.

Local camera and voice-effects research. Community help welcome.

![Status: goal not achieved](https://img.shields.io/badge/status-goal_not_achieved-orange)
![License: MIT](https://img.shields.io/badge/license-MIT-84e7cf)
![Local first](https://img.shields.io/badge/processing-on_device-84e7cf)

</div>

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
objects. The primary target is **free, local processing on Apple Silicon with
16 GB memory**, followed by verified virtual-camera delivery to video-call apps.
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

MorphLive defaults to **Live webcam face replacement (`GhostV2`)**. It processes
successive camera frames and replaces the face in your current scene. A reference
portrait supplies the target identity; it is not animated as the output video.
Your current hair, body, clothing, and surroundings remain in the camera frame.
Optional GFPGAN restoration improves some facial detail at a substantial speed cost
and starts disabled.

**Full appearance transformation is not implemented.** The current model changes
inner facial features, leaves beard/hair/head shape unchanged, and can paint over hands crossing the face when occlusion detection fails.
An optional separately installed XSeg guard now protects low-visibility regions;
its natural hand/movement quality has not yet passed acceptance. These are known failures, not camera-setting problems.
Obsolete photo-animation and procedural-mask backends have been removed.

**This is a development preview.** Processing stays local. Indistinguishable visual
quality, sustained real-time performance, Windows hardware support, and meeting
transmission are not established. Earlier Zoom preview reception is documented in
[implementation status](docs/IMPLEMENTATION_STATUS.md) and
[compatibility](docs/COMPATIBILITY.md).

## Features implemented in source

- **Live webcam face replacement (`GhostV2`, default)**: Replaces facial features in each camera frame, retaining the live scene. It does not animate a still photograph as the output.
- **18 Curated Adult Personas**: Corporate executive leaders, executive partners, and character personalities. Public reference photos retain their original credits and licenses.
- **Experimental virtual-camera route**: Source includes output to an installed OBS Virtual Camera. Reliable compatibility and performance across Zoom, Meet, Teams and other video apps have not been established.
- **Local DSP Voice Pairing**: Independent pitch shifting, formant envelope control, and soft noise gate.
- **Local processing**: No capture uploads or telemetry. Explicit local clip export is available; live capture is not recorded.

## Quick start

Requirements: Node.js 24 or newer, npm, a webcam and microphone.

```sh
git clone https://github.com/Shahrukhalid/morphlive.git
cd morphlive
npm install
npm start
```

Or run `./start.sh` on macOS/Linux or `start.bat` on Windows for 1-click startup.

Model installation downloads a pinned official Google model and verifies its
SHA-256. The app itself makes no model or runtime downloads. Live video requires
the separately installed native runtime, landmark model, and a local reference.
There is no procedural-mask or anonymous-avatar fallback.

For renderer development, `npm run dev` serves the UI on localhost. The packaged
Electron route is the reference runtime for media output selection and privacy.
Rebuild and restart Electron to apply renderer changes there.

## First session

1. Confirm you have permission to transform the selected input using the consent
   checkbox. Camera and microphone do not start automatically.
2. Open **Devices**. Choose a camera and microphone. Device labels may remain
   unavailable until the OS grants capture permission.
3. Choose an explicit **Processed audio output**: silent processing for a feedback-free test, headphones for listening, or your
   installed virtual cable for a call. Never use that cable as MorphLive's input.
4. Start camera and microphone separately. Select a persona in **Studio**.
5. Voice follows the persona while **Match voice to persona** is enabled. Moving
   pitch/formant sliders or selecting a voice independently enables manual mode.
6. Use **Voice lab** to mute, adjust gain, and audition with headphones. MorphLive
   sends audio to one selected sink; simultaneous monitoring needs OS routing.
7. Stop devices before changing selections. Use **Emergency stop** or `Escape`
   to release every output immediately.

## Use in a call

**Neural video:** Follow [native setup](docs/NEURAL_RUNTIME.md), activate the
OBS camera extension separately, start capture, then **Start virtual camera**.
Keep OBS’s own virtual camera stopped while the native engine sends frames.
Select **OBS Virtual Camera** in the receiver.

**Audio:** Install [BlackHole](https://github.com/ExistentialAudio/BlackHole) on
macOS, or [VB-CABLE](https://vb-audio.com/Cable/) on Windows, separately. In
MorphLive select **BlackHole 2ch** or **CABLE Input** as processed output. In your
calling app select **BlackHole 2ch** or **CABLE Output** as microphone. These
third-party drivers are not bundled and have separate licensing terms.

**Zoom:** Settings → Video → OBS Virtual Camera; Audio → microphone route above.
Use Zoom's audio test before joining a call.

**Google Meet:** Settings → Video → OBS Virtual Camera; Audio → microphone route.
Grant browser camera/microphone permission. Restart the browser after installing
a new virtual device if it is not listed.

**Teams:** Settings → Devices → camera and microphone routes above. Make a test
call where available. Restart Teams after driver installation if necessary.

These procedures are integration instructions, **not claims of completed
compatibility tests**. Check the [compatibility record](docs/COMPATIBILITY.md).
OBS Virtual Camera does not carry microphone audio. Adjust additional audio delay
using a visible clap in the receiving app; automatic A/V drift correction is not
implemented.

## Build and checks

```sh
npm test
npm run build
npm run check:privacy
npm run licenses
npm audit
npm run benchmark
npm run package:mac     # unsigned local .app; run on macOS
npm run package:win     # portable .exe; run on Windows
```

Local packages appear under `release/` and are ignored by Git. Packages are not
signed or notarized for distribution. Do not bypass OS security warnings. No
binary release is published until hardware acceptance and signing work is done.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) and [development](docs/DEVELOPMENT.md)
- [macOS setup](docs/MACOS_SETUP.md) and [Windows setup](docs/WINDOWS_SETUP.md)
- [Virtual camera](docs/VIRTUAL_CAMERA.md) and [virtual microphone](docs/VIRTUAL_MICROPHONE.md)
- [Testing](docs/TESTING.md), [performance](docs/PERFORMANCE.md), and [compatibility](docs/COMPATIBILITY.md)
- [Implementation status](docs/IMPLEMENTATION_STATUS.md) and [release plan](docs/RELEASE_PLAN.md)
- [Privacy](PRIVACY.md), [security](SECURITY.md), [contributing](CONTRIBUTING.md), and [third-party notices](THIRD_PARTY_NOTICES.md)

## Responsible use

Use your own likeness or material you have permission to transform. Keep the
synthetic disclosure visible where relevant. Do not use MorphLive for deceptive
impersonation, unauthorized likeness replication, or nonconsensual voice cloning.
No real-person face or voice assets are included.

## License

Original MorphLive application source is MIT licensed.
Third-party components retain their licenses. Model weights and external drivers
are not included in this source repository.

### Local rendered clips

The desktop **Render clip** workspace exports local videos using frame-by-frame GhostV2 face replacement, full-precision inference, and optional GFPGAN detail restoration. Install FFmpeg/FFprobe separately and select an installed adult reference. Choose a local video (up to five minutes), then a **new** MP4 filename. Output is capped at 1080p / 30 FPS, retains the source motion and audio (AAC re-encoded), and strips source metadata. Cancel or Escape stops the job. No camera or microphone starts during export and no clip is uploaded.

This is face replacement: hair, body, clothing, and scene remain from the input. Undetected-face frames are black. Restoration may alter facial details, and seams, flicker, and imperfect identity remain possible. Rendered export is not a claim of Higgsfield-equivalent quality or live conferencing performance.

The optional foreground guard installs with
`python3.11 scripts/install-faceswap.py --occlusion`. It adds local processing
time and does not generate hair, beard or head shape. See the replacement-engine
measurements and limitations in [neural runtime](docs/NEURAL_RUNTIME.md).
