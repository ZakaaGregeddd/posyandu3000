import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { initDb, executeQuery, getDbPath } from "../lib/db/sqlite";

let mainWindow: BrowserWindow | null = null;
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
    // Start Next.js server directly in the Main Process (no child process spawn needed)
    try {
      process.env.PORT = "3000";
      process.env.NODE_ENV = "production";
      
      // Require the standalone server. Next.js starts listening automatically when loaded.
      // Use dynamic require since it's a generated JS file at runtime
      require(path.join(__dirname, "../../.next/standalone/server.js"));

      const waitOn = require("wait-on");
      waitOn({ 
        resources: ["http://localhost:3000"],
        timeout: 15000 
      }).then(() => {
        if (mainWindow) {
          mainWindow.loadURL("http://localhost:3000");
        }
      }).catch((err: any) => {
        console.error("Gagal terhubung ke server Next.js lokal:", err);
      });
    } catch (err: any) {
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
  if (process.platform !== "darwin") {
    app.quit();
  }
});
