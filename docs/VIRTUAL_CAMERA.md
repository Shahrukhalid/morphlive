# Virtual camera route

The implemented backend is a dedicated MorphLive Output window captured by OBS.
The app does not register a MorphLive Virtual Camera device. The selectable device
is OBS Virtual Camera. Native macOS Camera Extensions and Windows Media Foundation
virtual camera backends are future work requiring platform-specific implementation,
signing, activation, and compatibility testing.

1. Start the camera and choose an effect.
2. Click Open output. The window is a clean canvas with optional synthetic label.
3. In OBS create a scene and add macOS Screen Capture in window mode, or Windows
   Window Capture. Choose MorphLive Output, never the main studio window.
4. Fit the source to the scene. Disable unrelated sources and recording.
5. Start OBS Virtual Camera. Select it in a call's camera settings.
6. Verify transformed motion in the receiving app. Stop OBS Virtual Camera when
   finished, along with MorphLive capture.

The main preview targets 30 FPS. Output copies are capped around 15 FPS and use
bounded image messages; they are not a verified 720p30 native camera path. Keep
its window unminimized. The projector blanks on stop or missing frames, but OBS
and receivers may retain a previous frame. Check the receiving app directly.

Backend availability is visible through enumerated camera devices after media
permissions, but presence alone does not prove an active OBS route. The UI only
reports output window status, never claims an external app has received video.

Upstream references:
https://obsproject.com/kb/virtual-camera-guide
https://obsproject.com/kb/window-capture-sources
https://obsproject.com/kb/macos-permissions-guide
