const { app, BrowserWindow, protocol, net, session, systemPreferences } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
protocol.registerSchemesAsPrivileged([{ scheme: 'morph', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
let main;
const local = (url) => { try { const parsed = new URL(url); return parsed.protocol === 'morph:' && parsed.host === 'studio'; } catch { return false; } };
app.whenReady().then(() => {
  const root = path.resolve(__dirname, '../../../dist');
  protocol.handle('morph', (request) => {
    const url = new URL(request.url);
    if (url.host !== 'studio') return new Response('Forbidden', { status: 403 });
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(target).href);
  });
  // Deny remote connections, including accidental telemetry in dependencies.
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const packagedFile = details.url.startsWith(pathToFileURL(root + path.sep).href);
    callback({ cancel: !packagedFile && !/^(morph:|devtools:|blob:|data:)/.test(details.url) });
  });
  session.defaultSession.setPermissionCheckHandler((contents, permission, origin) => local(origin) && permission === 'media');
  session.defaultSession.setPermissionRequestHandler(async (contents, permission, callback, details) => {
    if (!local(details.requestingUrl || contents.getURL()) || permission !== 'media') return callback(false);
    if (process.platform === 'darwin') {
      for (const kind of details.mediaTypes || []) {
        if (['audio', 'video'].includes(kind) && !await systemPreferences.askForMediaAccess(kind === 'audio' ? 'microphone' : 'camera')) return callback(false);
      }
    }
    callback(true);
  });
  main = new BrowserWindow({ width: 1500, height: 980, minWidth: 1050, minHeight: 740, backgroundColor: '#0c0e13', title: 'MorphLive', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  main.removeMenu();
  main.webContents.on('will-navigate', (event) => event.preventDefault());
  main.webContents.setWindowOpenHandler(({ url }) => local(url) && new URL(url).search === '?output=1'
    ? { action: 'allow', overrideBrowserWindowOptions: { title: 'MorphLive Output', width: 1280, height: 720, backgroundColor: '#000000', autoHideMenuBar: true, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } } }
    : { action: 'deny' });
  main.loadURL('morph://studio/index.html');
  main.on('closed', () => app.quit());
});
app.on('window-all-closed', () => app.quit());
