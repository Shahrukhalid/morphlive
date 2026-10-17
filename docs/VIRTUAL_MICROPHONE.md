# Virtual microphone route

MorphLive selects an explicit AudioContext output sink from enumerated OS audio
outputs. Use headphones for monitoring or an installed virtual audio cable for
external applications. No virtual audio driver is bundled or installed.

macOS: BlackHole 2ch is an example separate route. Choose it as MorphLive output
and as the calling app's microphone. Installation may require a restart. See
https://github.com/ExistentialAudio/BlackHole/wiki/Installation

Windows: VB-CABLE is an example separate route. Choose CABLE Input as MorphLive
output and CABLE Output as the call's microphone. Observe its separate license:
https://vb-audio.com/Cable/

Keep the actual microphone selected as input. A loopback input can cause runaway
feedback. Start with headphones, modest gain, and no call active. Test mute and
emergency stop in the receiving application. Select only one processed output;
simultaneous monitoring and cable routing needs OS-specific aggregate/multi-output
configuration and is not managed by MorphLive.

Refresh device enumeration after driver changes. Permission or browser-runtime
restrictions may hide outputs until microphone access is granted. Device presence
and routed audio status do not verify an external receiver. Audible quality,
driver latency, and end-to-end call reception require hands-on testing.

The preferred name MorphLive Virtual Microphone is reserved for a possible future
native backend. Current routes keep third-party device names intact.
