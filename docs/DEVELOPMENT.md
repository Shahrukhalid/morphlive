# Development

Use Node.js 24+, npm, and Git. Run `npm ci` and `npm run runtime:install` to obtain
the exact locked source dependencies and official Electron binary. Run
`npm run model:install` explicitly if face tracking is needed. Then run
`npm run build` and `npm run desktop`. Never start camera or microphone by default.

`npm run dev` starts a localhost renderer development server. It is not used by
the hardened Electron shell, which serves only dist. Rebuild/restart the desktop
for reference behavior. Electron DevTools can be opened through standard keyboard
shortcuts in development where supported; do not commit logs with private paths.

Run `npm test`, `npm run build`, `npm run check:privacy`, `npm run licenses`, and
`npm audit` before submitting changes. The lockfile is committed. A downloader
override is used to remove the legacy @electron/get dependency chain; verify
packaging whenever that override changes.

Build local macOS bundles with `npm run package:mac`, and Windows portable
executables with `npm run package:win` on their respective OS. These commands do
not publish releases, install drivers, or sign/notarize binaries. Do not distribute
unsigned development packages as production installers.
