const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    getSetupFiles: () => ipcRenderer.invoke('getSetupFiles'),
    // ...other handlers
  },
});
