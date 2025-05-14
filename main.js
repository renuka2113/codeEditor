import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { executeCCode } from './allcode-api/runCcode.js';
import {executePYCode} from './allcode-api/runPYcode.js';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // win.loadURL('http://localhost:5173');
if (process.env.NODE_ENV === 'development') {

    win.loadURL('http://localhost:5173');
    console.log("here");
  } else {
    win.loadFile(resolve(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);


ipcMain.handle('open-file', async () => {
  const { canceled ,filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
  if (canceled || filePaths.length === 0) return null;

  const content = await fs.readFile(filePaths[0], 'utf-8');
  return { name: path.basename(filePaths[0]), content };
});

ipcMain.handle('read-file', async (_, filePath) => {
  return await fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('save-file', async (_,filePath,content) => {

  if (!filePath) {
    const { filePath: newFilePath } = await dialog.showSaveDialog({
      title: 'Save File',
      defaultPath: 'Untitled.txt',
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    
      if (!newFilePath) return null; 
      filePath = newFilePath;
  }
  
  if (filePath) {
    await fs.writeFile(filePath, content,'utf-8');
    return filePath;
  }
});

ipcMain.handle('show-save-dialog', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: 'untitled',
    buttonLabel: 'Save',
    // filters: [{ name: 'JavaScript Files', extensions: ['js'] }],
  });

  return filePath || null;
});

ipcMain.handle('run-code', async (_, code, language) => {
  let result;
  console.log("selected :   ",language)
  switch(language) {
    case 'c':
      result = await executeCCode(code);
      break;
    case 'python':
      result = await executePYCode(code);
      break;
    default:
      result = { error: 'Unsupported language' };
  }
  return result;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});