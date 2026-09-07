const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
let tray = null;
const PORT = process.env.PORT || 5000;

function startBackendServer() {
  try {
    process.env.WACRM_DATA_PATH = app.getPath('userData');
    console.log('[Electron] WACRM_DATA_PATH set to:', process.env.WACRM_DATA_PATH);
    require('../server/index.js');
    console.log('[Electron] Server backend CRM berhasil dijalankan.');
  } catch (err) {
    console.error('[Electron] Gagal memulai server backend:', err);
  }
}

function waitForServer(callback, retries = 0) {
  if (retries > 40) {
    console.warn('[Electron] Server port check timeout, attempting window load anyway.');
    return callback();
  }
  http.get(`http://localhost:${PORT}/api/accounts`, (res) => {
    if (res.statusCode === 200) {
      callback();
    } else {
      setTimeout(() => waitForServer(callback, retries + 1), 400);
    }
  }).on('error', () => {
    setTimeout(() => waitForServer(callback, retries + 1), 400);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'WACRM Pro - Multi-WhatsApp Enterprise CRM',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#FFFFFF'
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Saat jendela ditutup, minimize ke system tray agar WhatsApp tetap standby
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'client', 'public', 'favicon.svg');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Buka WACRM Pro',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Buka di Browser',
        click: () => {
          shell.openExternal(`http://localhost:${PORT}`);
        }
      },
      { type: 'separator' },
      {
        label: 'Keluar Sepenuhnya',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('WACRM Pro - WhatsApp CRM Berjalan');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('[Electron] Tray init note:', err.message);
  }
}

// Cegah membuka multiple instance sekaligus
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startBackendServer();
    waitForServer(() => {
      createWindow();
      createTray();
    });
  });

  app.on('window-all-closed', () => {
    // Biarkan aplikasi tetap berjalan di background untuk menjaga koneksi WhatsApp
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
  });
}
