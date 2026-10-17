<div align="center">

# MorphLive

### Your local reality studio.

Live camera effects. Original face-tracked characters. A voice of your own.

![Status: experimental preview](https://img.shields.io/badge/status-experimental_preview-b7a0fa)
![License: MIT](https://img.shields.io/badge/license-MIT-84e7cf)
![Local first](https://img.shields.io/badge/processing-on_device-84e7cf)

</div>

MorphLive is an experimental Electron desktop application that processes camera
and microphone input locally. It uses MediaPipe face landmarks, a Canvas effect
renderer, and a streaming AudioWorklet phase vocoder. No account, API key, cloud
processing, recording, or telemetry is required.

**This is a development preview, not a finished production release.** Automated
DSP and build checks pass. Physical camera, audible quality, external virtual
devices, sustained sessions, and conferencing acceptance tests still require
verification. Read [implementation status](docs/IMPLEMENTATION_STATUS.md) before
using it in a live call.

## Features implemented in source

- Explicit camera and microphone capture, device selection, stop and mute.
- Optional local face landmark tracking in a worker with one frame in flight.
- Six original character pairings: Neutral Studio, Atlas, Nova, Orbit, Cyber,
  and Ghost. Includes studio color adjustment, face-attached masks, an expressive
  generic avatar, and full-frame privacy replacement.
- Independent pitch shifting and approximate spectral-envelope formant control,
  robot modulation, output gain, soft noise gate, and clipping ceiling.
- Persona-linked voice settings, manual override, smooth DSP parameter changes,
  and locally saved custom appearance/voice pairings.
- Original-camera comparison, landmark overlay, performance profiles, estimated
  audio latency, measured preview FPS, and redacted diagnostics export.
- A separate output window for OBS capture; explicit audio output selection for
  headphones or a separately installed virtual audio device.
- Emergency stop (`Escape`) closes camera, microphone, and output window.

There is no realistic face replacement, voice cloning, native virtual camera,
native virtual microphone, neural denoiser, automatic clock drift correction, or
verified GPU model acceleration. Masks are overlays, not realistic AI face swaps.
Character voice mappings are editable settings, not identity or gender inference.

## Quick start

Requirements: Node.js 24 or newer, npm, a webcam and microphone, and a supported
Electron desktop environment. Development currently targets macOS and Windows;
Windows and Intel Mac verification is pending.

```sh
git clone https://github.com/Shahrukhalid/morphlive.git
cd morphlive
npm ci
npm run runtime:install
# Optional, explicit download for face-attached effects:
npm run model:install
npm run build
npm run desktop
```

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
3. Choose an explicit **Processed audio output**: headphones for testing or your
   installed virtual cable for a call. Never use that cable as MorphLive's input.
4. Start camera and microphone separately. Select a persona in **Studio**.
5. Voice follows the persona while **Match voice to persona** is enabled. Moving
   pitch/formant sliders or selecting a voice independently enables manual mode.
6. Use **Voice lab** to mute, adjust gain, and audition with headphones. MorphLive
   sends audio to one selected sink; simultaneous monitoring needs OS routing.
7. Stop devices before changing selections. Use **Emergency stop** or `Escape`
   to release every output immediately.

## Use in a call

**Video:** Install OBS separately. In MorphLive open **Output**. In OBS add a
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
