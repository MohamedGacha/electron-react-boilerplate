/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.handle('getSetupFiles', async () => {
  // Recursively find all .json files in the setups folder
  interface JsonFileResult {
    path: string;
  }

  function findJsonFiles(dir: string, accSetupsPath: string): JsonFileResult[] {
    let results: JsonFileResult[] = [];
    const list: string[] = fs.readdirSync(dir);
    list.forEach((file: string) => {
      const filePath: string = path.join(dir, file);
      const stat: fs.Stats = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findJsonFiles(filePath, accSetupsPath));
      } else if (file.toLowerCase().endsWith('.json')) {
        results.push({ path: path.relative(accSetupsPath, filePath) });
      }
    });
    return results;
  }

  try {
    const documentsPath = path.join(os.homedir(), 'Documents');
    const accSetupsPath = path.join(
      documentsPath,
      'Assetto Corsa Competizione',
      'Setups',
    );
    if (!fs.existsSync(accSetupsPath)) return [];
    return findJsonFiles(accSetupsPath, accSetupsPath);
  } catch {
    return [];
  }
});

ipcMain.on(
  'save-setup-file',
  (event, { carName, trackName, fileName, fileContent }) => {
    // Dynamically get ACC setups folder for any user
    const accSetupsFolder = path.join(
      os.homedir(),
      'OneDrive',
      'Documents',
      'Assetto Corsa Competizione',
      'Setups',
    );

    // If not found, fallback to Documents (for users without OneDrive)
    let setupsFolder = accSetupsFolder;
    if (!fs.existsSync(setupsFolder)) {
      setupsFolder = path.join(
        os.homedir(),
        'Documents',
        'Assetto Corsa Competizione',
        'Setups',
      );
    }

    // Car folder
    const carFolder = path.join(setupsFolder, carName);
    if (!fs.existsSync(carFolder)) fs.mkdirSync(carFolder, { recursive: true });

    // Track folder
    const trackFolder = path.join(carFolder, trackName);
    if (!fs.existsSync(trackFolder))
      fs.mkdirSync(trackFolder, { recursive: true });

    // Final file path
    const filePath = path.join(trackFolder, fileName);

    // Save file
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        event.reply('setup-file-saved', `Error: ${err.message}`);
      } else {
        event.reply('setup-file-saved', filePath);
      }
    });
  },
);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  // Removed unused getAssetPath function

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    icon: path.join(__dirname, '..', 'assets', '../../assets/icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    autoHideMenuBar: true, // <-- Add this line to hide the menubar
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    app.setName('GoatSetups'); // Set the Electron app name
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
