const { app, BrowserWindow, protocol, net, session, systemPreferences, ipcMain, dialog, shell, powerSaveBlocker } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { validatePreferences } = require('./preferences.cjs');
const { ClipRenderer } = require('./render.cjs');
const { NeuralBridge } = require('./neural.cjs');
const { pathToFileURL } = require('node:url');
protocol.registerSchemesAsPrivileged([{ scheme: 'morph', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
let main;
let neural;
let clip;
let choosingClip=false;
const local = (url) => { try { const parsed = new URL(url); return parsed.protocol === 'morph:' && parsed.host === 'studio'; } catch { return false; } };
app.whenReady().then(() => {
  let runtimeRoot=app.isPackaged?path.join(app.getPath('userData'),'neural-runtime'):path.resolve(__dirname,'../../..');
  const runtimeLocation=path.join(app.getPath('userData'),'neural-runtime-location.json');
  try{if(fs.statSync(runtimeLocation).size<8192){const saved=JSON.parse(fs.readFileSync(runtimeLocation,'utf8'));if(typeof saved.root==='string'&&path.isAbsolute(saved.root))runtimeRoot=saved.root;}}catch{}
  const catalog=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../native/references.json'),'utf8'));
  let photoAttributions=[];try{photoAttributions=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../native/actor-references.json'),'utf8'));}catch{}
  const script=path.resolve(__dirname,'../../../native/morphlive_engine/server.py').replace('app.asar'+path.sep,'app.asar.unpacked'+path.sep);
  let activity;
  neural=new NeuralBridge(runtimeRoot,script,{activity:active=>{
    if(active&&activity===undefined)activity=powerSaveBlocker.start('prevent-app-suspension');
    if(!active&&activity!==undefined){powerSaveBlocker.stop(activity);activity=undefined;}
  }});
  clip=new ClipRenderer(runtimeRoot,script.replace('server.py','render.py'));
  ipcMain.handle('render:command',async(event,request)=>{
    if(event.sender!==main?.webContents||!request||typeof request!=='object')throw new Error('Forbidden');
    if(request.op==='status')return clip.state;
    if(request.op==='cancel')return clip.cancel();
    if(request.op==='open'&&clip.output){await shell.openPath(clip.output);return clip.state;}
    if(request.op!=='start'||!catalog.some(item=>item.id===request.reference))throw new Error('Invalid clip command');
    if(neural.child||clip.busy||choosingClip)throw new Error('Stop capture or the current render first.');
    choosingClip=true;
    try{
      const input=await dialog.showOpenDialog(main,{title:'Choose a local clip (up to five minutes)',properties:['openFile'],filters:[{name:'Video',extensions:['mp4','mov','mkv','webm']}]});
      if(input.canceled)return clip.state;
      const output=await dialog.showSaveDialog(main,{title:'Save rendered clip',defaultPath:'morphlive-render-'+Date.now()+'.mp4',filters:[{name:'MP4 video',extensions:['mp4']}]});
      if(output.canceled||!output.filePath)return clip.state;
      if(fs.existsSync(output.filePath))throw new Error('Choose a new filename; existing videos are never replaced.');
      return clip.start({input:input.filePaths[0],output:output.filePath,reference:request.reference,restore:request.restore!==false});
    }finally{choosingClip=false;}
  });
  const catalogStatus=()=>catalog.map(item=>{
    const file=path.join(runtimeRoot,'.runtime/references',item.id+'.png');const installed=fs.existsSync(file);
    let attribution=photoAttributions.find(photo=>photo.id===item.id);
    if(attribution&&(!installed||fs.statSync(file).size>10_000_000||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==attribution.sha256))attribution=undefined;
    return {...item,installed,attribution};
  });
  ipcMain.handle('neural:command',async(event,request)=>{
    if(event.sender!==main?.webContents||!request||typeof request!=='object')throw new Error('Forbidden');
    if((clip.busy||choosingClip)&&!['status','stop'].includes(request.op))throw new Error('Wait for clip rendering to finish or cancel it first.');
    const reference=catalog.find(item=>item.id===request.reference);
    if(request.op==='status')return {references:catalogStatus(),running:!!neural.child,restorationAvailable:fs.existsSync(path.join(runtimeRoot,'.runtime/models/ghostv2/restorer.safetensors'))};
    if(request.op==='stop'){neural.stop();return {ok:true};}
    if(request.op==='setup'){
      if(neural.child)throw new Error('Stop neural capture before changing runtime.');
      const choice=await dialog.showOpenDialog(main,{title:'Select the MorphLive folder containing .venv and .runtime',properties:['openDirectory']});
      if(!choice.canceled&&choice.filePaths[0]){
        const selected=choice.filePaths[0];
        if(!fs.existsSync(path.join(selected,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python')))throw new Error('Choose the installed MorphLive source folder containing .venv.');
        runtimeRoot=selected;neural.root=runtimeRoot;clip.root=runtimeRoot;
        fs.writeFileSync(runtimeLocation,JSON.stringify({root:runtimeRoot}),{mode:0o600});
      }
      return {references:catalogStatus(),restorationAvailable:fs.existsSync(path.join(runtimeRoot,'.runtime/models/ghostv2/restorer.safetensors'))};
    }
    if(request.op==='import'&&reference){
      if(neural.child)throw new Error('Stop neural capture before importing a reference.');
      const choice=await dialog.showOpenDialog(main,{title:'Choose an adult reference you have permission to transform',properties:['openFile'],filters:[{name:'Portrait image',extensions:['png','jpg','jpeg','webp']}]});
      if(!choice.canceled&&choice.filePaths[0]){
        const source=choice.filePaths[0];if(fs.statSync(source).size>10_000_000)throw new Error('Choose an image smaller than 10 MB.');
        const target=path.join(runtimeRoot,'.runtime/references');fs.mkdirSync(target,{recursive:true,mode:0o700});fs.copyFileSync(source,path.join(target,reference.id+'.png'));fs.chmodSync(path.join(target,reference.id+'.png'),0o600);
      }
      return {references:catalogStatus()};
    }
    if(request.op==='start'&&reference&&request.backend==='faceswap'){try{return await neural.start(reference.id,request.backend,request.enhance===true);}catch(error){neural.stop();throw error;}}
    if(request.op==='frame'&&typeof request.jpeg==='string'&&request.jpeg.length<=1_400_000)return neural.request({op:'frame',jpeg:request.jpeg});
    if(request.op==='virtual'&&typeof request.enabled==='boolean')return neural.request({op:'virtual',enabled:request.enabled});
    if(request.op==='enhance'&&typeof request.enhance==='boolean')return neural.request({op:'enhance',enhance:request.enhance});
    if(request.op==='reference'&&reference)return neural.request({op:'reference',reference:reference.id});
    throw new Error('Invalid neural command');
  });
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
    try {
      if (process.platform === 'darwin') {
        for (const kind of details.mediaTypes || []) {
          if (['audio', 'video'].includes(kind) && !await systemPreferences.askForMediaAccess(kind === 'audio' ? 'microphone' : 'camera')) return callback(false);
        }
      }
      callback(true);
    } catch {
      // A rejected OS prompt must deny, not leave the request hanging.
      callback(false);
    }
  });
  const settingsPath=path.join(app.getPath('userData'),'morphlive-preferences.json');
  ipcMain.on('preferences:load', event => {
    event.returnValue='';
    if(event.sender !== main?.webContents)return;
    try { if(fs.statSync(settingsPath).size<=16384)event.returnValue=validatePreferences(fs.readFileSync(settingsPath,'utf8'))||''; } catch {}
  });
  ipcMain.handle('preferences:save', (event, serialized) => {
    if(event.sender !== main?.webContents)return false;
    const valid=validatePreferences(serialized);if(!valid)return false;
    try { fs.writeFileSync(settingsPath+'.tmp',valid,{mode:0o600});fs.renameSync(settingsPath+'.tmp',settingsPath);return true; } catch {return false;}
  });
  main = new BrowserWindow({ width: 1500, height: 980, minWidth: 1050, minHeight: 740, backgroundColor: '#0c0e13', title: 'MorphLive', webPreferences: { preload: path.join(__dirname,'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  main.removeMenu();
  main.webContents.on('will-navigate', (event) => event.preventDefault());
  main.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  main.loadURL('morph://studio/index.html');
  main.on('closed', () => app.quit());
}).catch(() => {
  // Startup failures (for example an unreadable bundled catalog) must not leave a
  // windowless process running. Details are not shown because they can contain paths.
  dialog.showErrorBox('MorphLive could not start', 'The application files are missing or damaged. Reinstall or rebuild MorphLive.');
  app.exit(1);
});
app.on('before-quit', () => {neural?.stop();clip?.cancel();session.defaultSession.flushStorageData();});
app.on('window-all-closed', () => app.quit());
