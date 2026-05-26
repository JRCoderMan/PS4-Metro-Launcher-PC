const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const dataFile = path.join(__dirname, "data.json");

function loadData() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "index.html"));
}

/* EXE PICKER */
ipcMain.handle("pick-exe", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Games", extensions: ["exe"] }]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

/* LAUNCH GAME */
ipcMain.on("launch-exe", (e, filePath) => {
  exec(`"${filePath}"`);
});

/* SAVE / LOAD */
ipcMain.handle("load-games", () => loadData());
ipcMain.handle("save-games", (e, data) => saveData(data));

/* TURN OFF */
ipcMain.on("shutdown-app", () => {
  app.quit();
});

app.whenReady().then(createWindow);