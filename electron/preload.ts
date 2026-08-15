import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  query: (sql: string, params: any[] = []) => {
    return ipcRenderer.invoke("db-query", sql, params);
  },
});
