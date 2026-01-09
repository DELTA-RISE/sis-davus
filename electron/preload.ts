import { contextBridge } from "electron";

// Expose safe APIs to the renderer process if needed
contextBridge.exposeInMainWorld("electron", {
    // Example:
    // versions: process.versions,
});
