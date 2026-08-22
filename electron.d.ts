interface Window {
  electronAPI: {
    query: (sql: string, params?: any[]) => Promise<any>;
    exportDatabase: () => Promise<{ success: boolean; message: string }>;
    importDatabase: () => Promise<{ success: boolean; message: string }>;
    resetDatabase: () => Promise<{ success: boolean; message: string }>;
    selectDirectory: () => Promise<string | null>;
    setDatabasePath: (folderPath: string) => Promise<{ success: boolean; message: string }>;
    getDatabasePath: () => Promise<string>;
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onDownloadProgress: (callback: (progress: any) => void) => () => void;
    onUpdateDownloaded: (callback: () => void) => () => void;
    startDownload: () => Promise<void>;
    quitAndInstall: () => Promise<void>;
  };
}
