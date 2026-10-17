# macOS setup

Apple Silicon is the development environment. Intel builds and supported minimum
OS versions need validation against the chosen Electron release. Use Node.js
24+, install dependencies, install the Electron runtime, build, and launch as
shown in README. The app bundle declares camera and microphone usage strings.

Grant camera and microphone permissions when requested after you press Start.
If denied, open System Settings → Privacy & Security → Camera / Microphone and
grant access to the development Electron or packaged MorphLive app. Restart the
application after changing permissions. MorphLive does not bypass OS controls.

Install current OBS separately. Grant OBS Screen & System Audio Recording access
as required by your macOS version. Add macOS Screen Capture in window mode and
select MorphLive Output. Start OBS Virtual Camera and follow any official OBS
extension activation steps. It is displayed as OBS Virtual Camera.

For audio, install BlackHole separately from its official source, following its
installer and restart instructions. Choose BlackHole 2ch as MorphLive output and
as the calling application's microphone. Keep the actual microphone selected as
MorphLive input. Use headphones and explicit routing for monitoring. Do not set
MorphLive input and output to the same loopback device.

`npm run package:mac` creates an unsigned local .app. Distribution requires Apple
Developer signing, hardened runtime configuration, entitlements review, and
notarization. No system extension or standalone virtual microphone is bundled.
