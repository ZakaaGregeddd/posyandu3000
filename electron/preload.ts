const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  query: (sql: string, params: any[] = []) => {
    return ipcRenderer.invoke("db-query", sql, params);
  },
});
