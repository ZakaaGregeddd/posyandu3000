const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initDb, executeQuery, getDbPath } = require("../lib/db/sqlite");

let mainWindow = null;
let serverProcess = null;
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Posyandu3000 Desktop",
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    // Start Next.js server in production using child_process
    try {
      const { fork } = require("child_process");
      const nextPath = require.resolve("next/dist/bin/next");
      
      serverProcess = fork(nextPath, ["start", "-p", "3000"], {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, NODE_ENV: "production" }
      });

      const waitOn = require("wait-on");
      waitOn({ 
        resources: ["http://localhost:3000"],
        timeout: 10000 
      }).then(() => {
        mainWindow.loadURL("http://localhost:3000");
      }).catch((err) => {
        console.error("Gagal terhubung ke server Next.js lokal:", err);
      });
    } catch (err) {
      console.error("Gagal mematangkan server Next.js:", err);
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const appDataPath = app.getPath("userData");
  const dbPath = getDbPath(appDataPath);
  console.log("Database SQLite diinisialisasi di:", dbPath);
  initDb(dbPath);

  // Set up IPC channels for Database Queries
  ipcMain.handle("db-query", async (_event: any, sql: string, params: any[] = []) => {
    try {
      return executeQuery(sql, params);
    } catch (error: any) {
      console.error("Database Query Error:", error);
      throw error;
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
