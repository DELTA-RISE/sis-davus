export interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options: any;
}

export interface ElectronAPI {
    print: (content: string, printerName?: string) => Promise<{ success: boolean; error?: string }>;
    getPrinters: () => Promise<PrinterInfo[]>;
    setProgressBar: (value: number) => void;
    onDeepLink: (callback: (url: string) => void) => void;
    showNotification: (title: string, body: string, silent?: boolean) => void;
    setAutoLaunch: (enable: boolean) => Promise<boolean>;
    getAutoLaunch: () => Promise<boolean>;
    onThemeChanged: (callback: (theme: "dark" | "light") => void) => () => void;
    openChildWindow: (route: string, options?: { title?: string; width?: number; height?: number }) => Promise<{ success: boolean }>;

    // Scale
    getSerialPorts: () => Promise<any[]>;
    connectScale: (path: string, baudRate?: number) => Promise<{ success: boolean; error?: string }>;
    disconnectScale: () => Promise<boolean>;
    onScaleData: (callback: (data: string) => void) => () => void;

    // Filesystem
    // Filesystem
    saveFile: (fileName: string, content: string | any, mimeType?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    openExternal: (url: string) => void;

    // Generic
    on: (channel: string, callback: (data?: any) => void) => () => void;

    // Scanner
    scanDocument: (fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    listScannedDocuments: () => Promise<Array<{ name: string; path: string; size: number; createdAt: Date }>>;
    importDocument: (path: string, customName?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    performOCR: (path: string) => Promise<{ success: boolean; text?: string; error?: string }>;
    renameDocument: (oldPath: string, newName: string) => Promise<{ success: boolean; error?: string }>;
    deleteDocument: (path: string) => Promise<{ success: boolean; error?: string }>;
    getFilePath: (file: File) => string;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}
