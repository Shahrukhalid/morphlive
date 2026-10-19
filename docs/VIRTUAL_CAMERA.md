# Virtual camera route

MorphLive sends completed neural frames through the separately installed OBS
camera extension using pyvirtualcam. It does not create a device named MorphLive
Virtual Camera; select **OBS Virtual Camera** in the receiving application.

1. Install the local neural runtime and activate the official OBS camera extension.
2. Keep OBS's own virtual-camera sender stopped.
3. Start the physical camera in MorphLive, then click **Start virtual camera**.
4. Select OBS Virtual Camera in Zoom, Meet or another receiving application.
5. Verify motion in that application's preview, then stop MorphLive output when done.

The earlier direct neural route was received in Zoom Workplace 7.2.2 preview;
meeting transmission and the updated occlusion pipeline remain unverified. The
virtual camera's advertised 30 FPS does not establish the neural processing rate.
MorphLive reports completed frame timings; actual conferencing latency needs a
receiver test. External apps may retain their last received frame after a stop.

The obsolete window-capture/projector route has been removed. MorphLive does not
install drivers, extensions or system permissions automatically. See
[neural runtime](NEURAL_RUNTIME.md) for setup and current limitations.

[Official OBS virtual camera guide](https://obsproject.com/kb/virtual-camera-guide).
