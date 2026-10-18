# Architecture

Electron serves React/TypeScript from the local `morph://studio` protocol in a
sandboxed, isolated renderer. The preload exposes allowlisted preferences, neural
commands, and clip-render commands. The main process chooses all filesystem paths
through native dialogs; the renderer cannot execute arbitrary commands. Remote
requests are blocked by the session and CSP.

Live face replacement uses getUserMedia → bounded JPEG request → local Python
GhostV2 → face-region compositor → preview and optional OBS Virtual Camera. Only
one neural frame is in flight. Reference identity embeddings are held in memory.
Lost-face output is black. The model changes inner facial features; it has no
full-head generation or reliable foreground-object occlusion mask.

Local clip rendering uses a separate worker with one decoded frame at a time,
full-precision inference, optional GFPGAN restoration, and FFmpeg H.264/AAC output.
The main process prevents concurrent neural capture/rendering. Native dialogs
select input and a new output path. Successful output is published atomically;
existing files are never overwritten. Original motion/audio are retained, source
metadata is stripped, and cancellation terminates the worker.

Legacy procedural effects still use the MediaPipe browser worker and bounded
canvas output. Audio uses local AudioWorklet DSP for pitch/formant effects; this
is not neural voice cloning. Device identifiers are not saved. Preferences have a
validated schema and a fixed native storage file.

Emergency stop closes capture tracks, DSP, neural output, and requests clip
cancellation. The native worker closes the virtual device on exit. External
conferencing software can retain its last frame; reception and meeting behavior
require separate validation. See IMPLEMENTATION_STATUS.md for measured results.
