const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    openFile: async () =>{
        const result = await ipcRenderer.invoke('open-file');
        return result;
    }, 
    runCode: async (code,language) => {
        return ipcRenderer.invoke('run-code', code,language);
    },
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    saveFile: async (filePath,content) => {
        return ipcRenderer.invoke('save-file', filePath, content );

    }
});
