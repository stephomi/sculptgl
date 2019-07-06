const { app, BrowserWindow } = require('electron');
const windowStateKeeper = require('./electron-window-state');

var mainWindow;

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1366,
    defaultHeight: 768
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height
  });

  mainWindow.removeMenu();

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {

    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
