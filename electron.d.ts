interface Window {
  electronAPI: {
    query: (sql: string, params?: any[]) => Promise<any>;
    exportDatabase: () => Promise<{ success: boolean; message: string }>;
    importDatabase: () => Promise<{ success: boolean; message: string }>;
    resetDatabase: () => Promise<{ success: boolean; message: string }>;
  };
}
