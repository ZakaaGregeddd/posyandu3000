import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { initDb, executeQuery, getDbPath, closeDb, mergeDb, resetDb } from "../lib/db/sqlite";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;
let dbPath: string = "";

// Configure autoUpdater
autoUpdater.autoDownload = false;

function setupAutoUpdater() {
  autoUpdater.on("update-available", (info) => {
    mainWindow?.webContents.send("update-available", info);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow?.webContents.send("download-progress", progressObj);
  });

  autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("update-downloaded");
  });

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

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
  const configPath = path.join(appDataPath, "config.json");
  dbPath = getDbPath(appDataPath);

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.dbPath) {
        dbPath = config.dbPath;
      }
    } catch (e) {
      console.error("Gagal membaca config.json:", e);
    }
  }

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

  // Select folder dialog for custom db path
  ipcMain.handle("db-select-folder", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Pilih Folder Penyimpanan Database",
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Set custom path and re-initialize db
  ipcMain.handle("db-set-custom-path", async (_event: any, folderPath: string) => {
    try {
      const newDbPath = path.join(folderPath, "posyandu.db");
      
      closeDb();
      initDb(newDbPath);
      resetDb(); // Clear to start clean
      
      const config = { dbPath: newDbPath };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      dbPath = newDbPath;
      
      return { success: true, message: `Database berhasil diatur di: ${newDbPath}` };
    } catch (error: any) {
      console.error("Set Custom DB Path Error:", error);
      return { success: false, message: error.message || "Gagal mengatur lokasi database" };
    }
  });

  // Get current active database path
  ipcMain.handle("db-get-current-path", async () => {
    return dbPath;
  });

  ipcMain.handle("db-export", async () => {
    try {
      if (!mainWindow) return { success: false, message: "Window tidak aktif" };
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Ekspor Database (Backup)",
        defaultPath: path.join(app.getPath("downloads"), `posyandu-backup-${new Date().toISOString().split("T")[0]}.db`),
        filters: [{ name: "Database SQLite", extensions: ["db"] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, message: "Ekspor dibatalkan" };
      }

      fs.copyFileSync(dbPath, result.filePath);
      return { success: true, message: `Database berhasil diekspor ke: ${result.filePath}` };
    } catch (error: any) {
      console.error("Export Database Error:", error);
      return { success: false, message: error.message || "Gagal mengekspor database" };
    }
  });

  ipcMain.handle("db-import", async () => {
    try {
      if (!mainWindow) return { success: false, message: "Window tidak aktif" };
      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Gabungkan Database (Import & Merge)",
        filters: [{ name: "Database SQLite", extensions: ["db"] }],
        properties: ["openFile"],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: "Impor dibatalkan" };
      }

      const selectedPath = result.filePaths[0];

      // Merge the backup database with current database
      mergeDb(selectedPath);

      return { success: true, message: "Database berhasil digabungkan. Aplikasi akan memuat ulang halaman." };
    } catch (error: any) {
      console.error("Merge Database Error:", error);
      return { success: false, message: error.message || "Gagal menggabungkan database" };
    }
  });

  ipcMain.handle("db-reset", async () => {
    try {
      resetDb();
      return { success: true, message: "Database berhasil dikosongkan. Aplikasi akan memuat ulang halaman." };
    } catch (error: any) {
      console.error("Reset Database Error:", error);
      return { success: false, message: error.message || "Gagal mereset database" };
    }
  });

  ipcMain.handle("update-start-download", async () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.handle("update-quit-install", async () => {
    autoUpdater.quitAndInstall();
  });

  createWindow();

  if (!isDev) {
    setupAutoUpdater();
  }

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
