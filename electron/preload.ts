import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  query: (sql: string, params: any[] = []) => {
    return ipcRenderer.invoke("db-query", sql, params);
  },
  exportDatabase: () => {
    return ipcRenderer.invoke("db-export");
  },
  importDatabase: () => {
    return ipcRenderer.invoke("db-import");
  },
  resetDatabase: () => {
    return ipcRenderer.invoke("db-reset");
  },
  selectDirectory: () => {
    return ipcRenderer.invoke("db-select-folder");
  },
  setDatabasePath: (folderPath: string) => {
    return ipcRenderer.invoke("db-set-custom-path", folderPath);
  },
  getDatabasePath: () => {
    return ipcRenderer.invoke("db-get-current-path");
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    const subscription = (_event: any, info: any) => callback(info);
    ipcRenderer.on("update-available", subscription);
    return () => ipcRenderer.removeListener("update-available", subscription);
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on("download-progress", subscription);
    return () => ipcRenderer.removeListener("download-progress", subscription);
  },
  onUpdateDownloaded: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on("update-downloaded", subscription);
    return () => ipcRenderer.removeListener("update-downloaded", subscription);
  },
  startDownload: () => {
    return ipcRenderer.invoke("update-start-download");
  },
  quitAndInstall: () => {
    return ipcRenderer.invoke("update-quit-install");
  },
});
