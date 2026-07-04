const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // expose safe IPC methods here later (e.g. native file dialogs)
});
