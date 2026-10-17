# Contributing

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
