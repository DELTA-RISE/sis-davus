"use client";

import { useEffect, useState } from "react";
import type { PrinterInfo } from "@/types/electron";

export function useElectron() {
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        setIsElectron(typeof window !== "undefined" && !!window.electron);
    }, []);

    const getPrinters = async (): Promise<PrinterInfo[]> => {
        if (!window.electron) return [];
        return await window.electron.getPrinters();
    };

    const print = async (content: string, printerName?: string) => {
        if (!window.electron) return { success: false, error: "Electron not available" };
        return await window.electron.print(content, printerName);
    };

    // Scale Wrappers
    const getSerialPorts = async () => {
        if (!window.electron) return [];
        return await window.electron.getSerialPorts();
    };

    const connectScale = async (path: string, baudRate?: number) => {
        if (!window.electron) return { success: false, error: "Electron not available" };
        return await window.electron.connectScale(path, baudRate);
    };

    const disconnectScale = async () => {
        if (!window.electron) return false;
        return await window.electron.disconnectScale();
    };

    const onScaleData = (callback: (data: string) => void) => {
        if (window.electron) {
            return window.electron.onScaleData(callback);
        }
        return () => { };
    };

    // Filesystem Wrappers
    const saveFile = async (fileName: string, content: string | any, mimeType?: string) => {
        if (!window.electron) return { success: false, error: "Electron not available" };
        return await window.electron.saveFile(fileName, content, mimeType);
    };

    const openExternal = (url: string) => {
        if (window.electron) {
            window.electron.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    }

    const on = (channel: string, callback: (data?: any) => void) => {
        if (window.electron) {
            return window.electron.on(channel, callback);
        }
        return () => { };
    };

    const setProgressBar = (value: number) => {
        if (window.electron) {
            window.electron.setProgressBar(value);
        }
    }

    const setAutoLaunch = async (enable: boolean) => {
        if (!window.electron) return false;
        return await window.electron.setAutoLaunch(enable);
    };

    const openChildWindow = async (route: string, options?: { title?: string; width?: number; height?: number }) => {
        if (!window.electron) return { success: false };
        return await window.electron.openChildWindow(route, options);
    };

    const getAutoLaunch = async () => {
        if (!window.electron) return false;
        return await window.electron.getAutoLaunch();
    };

    const showNotification = (title: string, body: string, silent?: boolean) => {
        if (window.electron) {
            window.electron.showNotification(title, body, silent);
        }
    };

    return {
        isElectron,
        getPrinters,
        print,
        setProgressBar,
        setAutoLaunch,
        getAutoLaunch,
        showNotification,
        // Scale
        getSerialPorts,
        connectScale,
        disconnectScale,
        onScaleData,
        // FS
        saveFile,
        openExternal,
        on,
        // Window
        openChildWindow,
        // Scanner
        scanDocument: async (fileName: string) => {
            if (!window.electron) return { success: false, error: "Electron not available" };
            return await window.electron.scanDocument(fileName);
        },
        listScannedDocuments: async () => {
            if (!window.electron) return [];
            return await window.electron.listScannedDocuments();
        },
        importDocument: async (path: string, customName?: string) => {
            if (!window.electron) return { success: false };
            return await window.electron.importDocument(path, customName);
        },
        performOCR: async (path: string) => {
            if (!window.electron) return { success: false };
            return await window.electron.performOCR(path);
        },
        renameDocument: async (oldPath: string, newName: string) => {
            if (!window.electron) return { success: false };
            return await window.electron.renameDocument(oldPath, newName);
        },
        deleteDocument: async (path: string) => {
            if (!window.electron) return { success: false };
            return await window.electron.deleteDocument(path);
        },
        getFilePath: (file: File) => {
            if (!window.electron) return "";
            return window.electron.getFilePath(file);
        }
    };
}
