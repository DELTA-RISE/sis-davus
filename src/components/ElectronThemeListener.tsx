"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ElectronThemeListener() {
    const { setTheme } = useTheme();

    useEffect(() => {
        if (typeof window !== "undefined" && window.electron) {
            // Listen for theme changes from Main process
            const cleanup = window.electron.onThemeChanged((theme) => {
                setTheme(theme);
            });
            return cleanup;
        }
    }, [setTheme]);

    return null;
}
