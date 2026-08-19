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

  // Always open DevTools for debugging packaged app white screen issues
  mainWindow.webContents.openDevTools();

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // Start Next.js server directly in the Main Process
    try {
      process.env.PORT = "3000";
      process.env.NODE_ENV = "production";
      
      const serverDir = path.join(__dirname, "../../.next/standalone").replace("app.asar", "app.asar.unpacked");
      const serverScript = path.join(serverDir, "server.js");

      // Critical: Next.js standalone expects process.cwd() to be the standalone directory 
      // to correctly find the .next folder and required server files.
      if (require("fs").existsSync(serverDir)) {
        process.chdir(serverDir);
      } else {
        const { dialog } = require("electron");
        dialog.showErrorBox("Server Directory Missing", `Directory not found: ${serverDir}`);
      }
      
      require(serverScript);

      const http = require("http");
      
      const checkServer = (retries = 40, delay = 500) => {
        http.get("http://localhost:3000", () => {
          if (mainWindow) {
            mainWindow.loadURL("http://localhost:3000");
          }
        }).on("error", (err: any) => {
          if (retries > 0) {
            setTimeout(() => checkServer(retries - 1, delay), delay);
          } else {
            const { dialog } = require("electron");
            dialog.showErrorBox("Next.js Connection Error", "Gagal terhubung ke server Next.js setelah 20 detik.\n" + (err.stack || err.message || String(err)));
          }
        });
      };

      checkServer();
    } catch (err: any) {
      const { dialog } = require("electron");
      dialog.showErrorBox("Next.js Server Launch Error", err.stack || err.message || String(err));
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
