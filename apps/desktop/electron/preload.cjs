const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('morphPreferences', {
  load: () => ipcRenderer.sendSync('preferences:load'),
  save: serialized => ipcRenderer.invoke('preferences:save', serialized)
});
contextBridge.exposeInMainWorld('morphNeural', {command:request=>ipcRenderer.invoke('neural:command',request)});
