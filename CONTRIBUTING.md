# Contributing

## Help with the unmet appearance goal

MorphLive has not achieved realistic, smooth, live full-appearance transformation.
We welcome concrete model proposals, working ports, performance improvements and
independent validation. The primary target remains free, local Apple Silicon
processing with 16 GB memory; video comes first.

A useful proposal should identify the model and license, explain how it changes
hair/beard/head shape while preserving expressions and foreground occlusions,
and include a reproducible test with hardware, memory, completed generated FPS,
latency and failure cases. Report camera and receiver measurements separately
from isolated inference. A 24 FPS processing target alone does not prove realism
or acceptable call delay. Static portraits and synthetic affine motion cannot
validate natural expression or hand-occlusion fidelity.

Please open an issue before a substantial new engine integration. Keep failed
experiments isolated; do not replace the live default until quality, motion,
occlusion and received call output have passed. State any costs, cloud dependency
or different hardware requirement explicitly. Do not promise results that have
not been observed.

## Development and privacy

Start with the README and docs/IMPLEMENTATION_STATUS.md. Use Node.js 24+ and
`npm ci`. Changes should keep capture opt-in, processing local, queues bounded,
and emergency stop reliable. Do not introduce default recording or telemetry.

Before proposing a change run `npm test`, `npm run build`,
`npm run check:privacy`, `npm run licenses`, and `npm audit`. Include relevant
hardware validation without personal device names or media samples. Distinguish
PASS, FAIL, BLOCKED, and NOT TESTED. Never mark a conferencing route verified
based only on unit tests.

Use small pull requests describing the concrete behavior, relevant risks, and
verification. Do not submit personal face/voice assets, copyrighted characters,
unlicensed model weights, credentials, or raw local diagnostics. Use a GitHub
noreply address for public commits. Respect other contributors and obtain consent
before sharing anyone's likeness or voice.
