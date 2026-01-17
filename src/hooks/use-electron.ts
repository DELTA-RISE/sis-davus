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

    const setProgressBar = (value: number) => {
        if (window.electron) {
            window.electron.setProgressBar(value);
        }
    }

    return { isElectron, getPrinters, print, setProgressBar };
}
