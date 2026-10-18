# Security policy

This is an experimental preview. No version is currently certified for sensitive
or production use. Fixes target the current main branch.

Please report vulnerabilities using the repository's private vulnerability
reporting feature if available. Do not post tokens, private media, device IDs, or
sensitive logs in a public issue. If private reporting is unavailable, open a
minimal public request for a private reporting channel without exploit details.

The desktop renderer has Node integration disabled, context isolation enabled,
and sandboxing enabled. Navigation and unrelated popups are blocked. Only local
media permission requests are accepted and OS permission is still required.
Remote application traffic is denied. No arbitrary command execution or generic
filesystem IPC is exposed to the renderer. A narrow preferences bridge only
loads/saves a validated, size-limited settings schema at a fixed app-data file.

Model downloads use a pinned URL, maximum accepted size, and pinned SHA-256.
Models are not user-supplied executable plugins. No third-party drivers are
installed automatically. Review third-party model and driver terms separately.

CI runs tests, build, a source/history privacy scan, and dependency audits.
Automated secret scanning cannot detect every contextual secret; manually review
changes before publication. Never commit recordings, keys, private paths, or
weights. Do not attach unredacted operating-system crash reports.
