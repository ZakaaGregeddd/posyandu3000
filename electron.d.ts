interface Window {
  electronAPI: {
    query: (sql: string, params?: any[]) => Promise<any>;
  };
}
