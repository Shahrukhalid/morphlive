<div align="center">

# MorphLive

### Your local reality studio.

Live camera effects. Original face-tracked characters. A voice of your own.

![Status: experimental preview](https://img.shields.io/badge/status-experimental_preview-b7a0fa)
![License: MIT](https://img.shields.io/badge/license-MIT-84e7cf)
![Local first](https://img.shields.io/badge/processing-on_device-84e7cf)

</div>

MorphLive defaults to **Live webcam face replacement (`GhostV2`)**. It processes
successive camera frames and replaces the face in your current scene. A reference
portrait supplies the target identity; it is not animated as the output video.
Your current hair, body, clothing, and surroundings remain in the camera frame.
Optional GFPGAN restoration improves some facial detail at a substantial speed cost
and starts disabled.

**Photo animation (`LivePortrait`)** is a separate experimental option. It animates
a still reference portrait and can place it between blurred side panels. This is
not live scene replacement, full-body transformation, or proof of real-time speed.

**This is a development preview.** Processing stays local. Indistinguishable visual
quality, sustained real-time performance, Windows hardware support, and meeting
transmission are not established. Earlier Zoom preview reception is documented in
[implementation status](docs/IMPLEMENTATION_STATUS.md) and
[compatibility](docs/COMPATIBILITY.md).

## Features implemented in source

- **Live webcam face replacement (`GhostV2`, default)**: Replaces facial features in each camera frame, retaining the live scene. It does not animate a still photograph as the output.
- **Photo animation (`LivePortrait`, optional)**: Animates a reference portrait; widescreen formatting adds blurred side panels. This mode is separate from webcam face replacement.
- **18 Curated Adult Personas**: Corporate executive leaders, executive partners, and character personalities. Public reference photos retain their original credits and licenses.
- **Direct Virtual Camera Output**: Sends transformed frames directly to the OBS Virtual Camera for Zoom, Meet, Teams, Discord, and Omegle.
- **Local DSP Voice Pairing**: Independent pitch shifting, formant envelope control, and soft noise gate.
- **Strict Privacy**: 100% on-device processing. No recording, no telemetry, no network transmission of media or device identifiers.

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
SHA-256. The app itself makes no model or runtime downloads. Without it, original
video, studio color processing, and anonymous avatar fallback remain available.

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

**Legacy effects video:** Install OBS separately. In MorphLive open **Output**. In OBS add a
window capture of **MorphLive Output** (macOS Screen Capture in window mode on
modern Macs), fit it to the scene, and start **OBS Virtual Camera**. The separate
window contains only the transformed frame and disclosure. It targets about
15 FPS; the main preview targets 30 FPS. Keep the output window unminimized.

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

Original MorphLive source and procedural character artwork are MIT licensed.
Third-party components retain their licenses. Model weights and external drivers
are not included in this source repository.

### Local rendered clips

The desktop **Render clip** workspace exports local videos using frame-by-frame GhostV2 face replacement, full-precision inference, and optional GFPGAN detail restoration. Install FFmpeg/FFprobe separately and select an installed adult reference. Choose a local video (up to five minutes), then a **new** MP4 filename. Output is capped at 1080p / 30 FPS, retains the source motion and audio (AAC re-encoded), and strips source metadata. Cancel or Escape stops the job. No camera or microphone starts during export and no clip is uploaded.

This is face replacement: hair, body, clothing, and scene remain from the input. Undetected-face frames are black. Restoration may alter facial details, and seams, flicker, and imperfect identity remain possible. Rendered export is not a claim of Higgsfield-equivalent quality or live conferencing performance.
