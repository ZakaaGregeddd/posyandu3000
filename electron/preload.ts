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
});
