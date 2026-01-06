const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  log: (message) => ipcRenderer.send('log', message),
  error: (error) => ipcRenderer.send('error', error)
});
