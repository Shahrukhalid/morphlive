# Privacy

Camera and microphone start only after local consent and a start action. Input
media stays in volatile processing buffers. Live capture is not recorded or uploaded. The neural engine computes reference
identity embeddings in memory for face replacement; these are not saved. It does
not identify the person in a camera feed or send telemetry. Explicit local clip
rendering reads the selected video and writes a new MP4 only after a save action.
It does not upload the clip. Temporary exports are removed on normal cancellation
or failure; a forced operating-system kill may leave a private temporary folder.
The Electron session blocks remote requests. The renderer CSP restricts scripts,
workers, and connections to packaged resources.

Preferences are stored locally using localStorage and a schema-validated JSON
file in the OS application-data directory with owner-only creation permissions. They include selected persona,
DSP parameters, custom preset names, disclosure, and performance options. Device
IDs and device names are not persisted. Do not put private details in preset names
if you intend to share screenshots. Consent is reset when the app restarts.

Diagnostics export contains app version, performance values, pipeline booleans,
selected built-in reference ID, and profile. It excludes device names, identifiers,
raw errors, operating-system paths, camera media, and audio samples.

Model installation is a separate, explicit command contacting Google's official
model host. Dependency/runtime installation contacts package registries and
Electron release servers. These development actions are separate from offline
application processing. No capture data is attached to those requests.

The OBS/cable output routes intentionally expose transformed media to software
that selects those devices. Conferencing applications may transmit it according
to their own settings. Raw comparison is visible only inside the studio. The native virtual-camera
route receives the processed output; the studio comparison is not sent through
that route. Lost-face output is black. Optional occlusion detection can preserve
foreground pixels, but the transformation is not a guarantee of anonymity.

Emergency stop closes capture tracks, DSP and neural output, and requests
cancellation of a local clip job. External apps may retain their last received
frame. The obsolete browser projector and procedural masks have been removed.

No mandatory accounts, API keys, analytics, or cloud AI services are used.
