import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    print: async (content: string, printerName?: string) => {
        return ipcRenderer.invoke("print-silent", { content, printerName });
    },
    getPrinters: async () => {
        return ipcRenderer.invoke("get-printers");
    },
    setProgressBar: (value: number) => {
        ipcRenderer.send("set-progress-bar", value);
    },
    onDeepLink: (callback: (url: string) => void) => {
        ipcRenderer.on("deep-link", (_event, url) => callback(url));
    }
});
