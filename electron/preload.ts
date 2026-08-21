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
});
