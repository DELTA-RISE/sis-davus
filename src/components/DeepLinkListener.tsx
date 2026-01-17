"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useElectron } from "@/hooks/use-electron";

export function DeepLinkListener() {
    const { isElectron } = useElectron();
    const router = useRouter();

    useEffect(() => {
        if (!isElectron || !window.electron) return;

        window.electron.onDeepLink((url) => {
            console.log("Deep Link received:", url);
            // URL format: sisdavus://path?query
            // We need to strip standard protocol overhead if necessary or just parse it.
            // On Windows usually passed as full string.

            try {
                // If it starts with protocol, strip it
                const protocolPrefix = "sisdavus://";
                if (url.startsWith(protocolPrefix)) {
                    const path = url.substring(protocolPrefix.length);
                    // Navigate to the path (ensure it starts with /)
                    const targetPath = path.startsWith("/") ? path : `/${path}`;

                    toast.info(`Navegando via link externo: ${targetPath}`);
                    router.push(targetPath);
                }
            } catch (e) {
                console.error("Failed to handle deep link", e);
            }
        });
    }, [isElectron, router]);

    return null; // Headless component
}
