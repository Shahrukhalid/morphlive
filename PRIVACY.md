# Privacy

Camera and microphone start only after local consent and a start action. Input
media stays in volatile processing buffers. MorphLive does not record, upload,
stream to remote services, identify people, create embeddings, or send telemetry.
The Electron session blocks remote requests. The renderer CSP restricts scripts,
workers, and connections to packaged resources.

Preferences are stored locally using localStorage. They include selected persona,
DSP parameters, custom preset names, disclosure, and performance options. Device
IDs and device names are not persisted. Do not put private details in preset names
if you intend to share screenshots. Consent is reset when the app restarts.

Diagnostics export contains app version, performance values, pipeline booleans,
selected built-in persona ID, and profile. It excludes device names, identifiers,
raw errors, operating-system paths, camera media, and audio samples.

Model installation is a separate, explicit command contacting Google's official
model host. Dependency/runtime installation contacts package registries and
Electron release servers. These development actions are separate from offline
application processing. No capture data is attached to those requests.

The OBS/cable output routes intentionally expose transformed media to software
that selects those devices. Conferencing applications may transmit it according
to their own settings. Raw comparison is visible only inside the studio; OBS must
capture the dedicated output window. Privacy persona replaces the entire canvas,
even if tracking fails. Other mask effects return original camera pixels when a
face cannot be tracked; do not rely on them for anonymity.

Emergency stop closes capture tracks, DSP context, and the output window. The
projector blanks itself if it stops receiving frames. An external app or OBS may
retain its last received frame; stop OBS Virtual Camera separately when finished.

No mandatory accounts, API keys, analytics, or cloud AI services are used.
