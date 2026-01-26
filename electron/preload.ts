import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("electron", {
    getFilePath: (file: File) => webUtils.getPathForFile(file),
    print: async (content: string, printerName?: string) => {
        return ipcRenderer.invoke("print-silent", { content, printerName });
    },
    getPrinters: async () => {
        return ipcRenderer.invoke("get-printers");
    },
    // Scale API
    getSerialPorts: async () => {
        return ipcRenderer.invoke("scale-get-ports");
    },
    connectScale: async (path: string, baudRate?: number) => {
        return ipcRenderer.invoke("scale-connect", path, baudRate);
    },
    disconnectScale: async () => {
        return ipcRenderer.invoke("scale-disconnect");
    },
    onScaleData: (callback: (data: string) => void) => {
        ipcRenderer.on("scale-data", (_event, data) => callback(data));
        return () => ipcRenderer.removeAllListeners("scale-data");
    },
    // Filesystem & Shell
    saveFile: async (fileName: string, content: string | Buffer, mimeType?: string) => {
        return ipcRenderer.invoke("save-file", { fileName, content, mimeType });
    },
    openExternal: (url: string) => {
        ipcRenderer.send("open-external", url);
    },

    // Generic Event Listener (for one-way from Main)
    on: (channel: string, callback: (data?: any) => void) => {
        const validChannels = ['app-lock', 'theme-changed', 'deep-link', 'scale-disconnected'];
        if (validChannels.includes(channel)) {
            const listener = (_event: any, ...args: any[]) => callback(...args);
            ipcRenderer.on(channel, listener);
            return () => ipcRenderer.removeListener(channel, listener);
        }
        return () => { };
    },

    setProgressBar: (value: number) => {
        ipcRenderer.send("set-progress-bar", value);
    },
    showNotification: (title: string, body: string, silent?: boolean) => {
        ipcRenderer.send("show-notification", { title, body, silent });
    },
    setAutoLaunch: async (enable: boolean) => {
        return ipcRenderer.invoke("set-auto-launch", enable);
    },
    getAutoLaunch: async () => {
        return ipcRenderer.invoke("get-auto-launch");
    },
    onThemeChanged: (callback: (theme: "dark" | "light") => void) => {
        ipcRenderer.on("theme-changed", (_event, theme) => callback(theme));
        return () => {
            ipcRenderer.removeAllListeners("theme-changed");
        };
    },
    // Window Management
    openChildWindow: (route: string, options?: { title?: string; width?: number; height?: number }) => {
        return ipcRenderer.invoke("open-child-window", { route, ...options });
    },
    // Scanner
    scanDocument: (fileName: string) => {
        return ipcRenderer.invoke("scan-document", { fileName });
    },
    listScannedDocuments: () => {
        return ipcRenderer.invoke("list-scanned-documents");
    },
    importDocument: (path: string, customName?: string) => {
        return ipcRenderer.invoke("import-document", { filePath: path, customName });
    },
    performOCR: (path: string) => {
        return ipcRenderer.invoke("perform-ocr", path);
    },
    renameDocument: (oldPath: string, newName: string) => {
        return ipcRenderer.invoke("rename-document", { oldPath, newName });
    },
    deleteDocument: (path: string) => {
        return ipcRenderer.invoke("delete-document", path);
    },
    onDeepLink: (callback: (url: string) => void) => {
        ipcRenderer.on("deep-link", (_event, url) => callback(url));
    }
});
