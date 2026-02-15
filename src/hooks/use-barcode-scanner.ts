"use client";

import { useEffect, useRef } from "react";

interface UseBarcodeScannerProps {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeThreshold?: number; // Max ms between keystrokes to be considered a scan
}

export function useBarcodeScanner({ onScan, minLength = 3, timeThreshold = 50 }: UseBarcodeScannerProps) {
    const buffer = useRef<string>("");
    const lastKeyTime = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field (optional, depending on requirement)
            // Usually scanners should work even in inputs, but sometimes we want global handling
            // Ignore check removed as unused
            // const target = e.target as HTMLElement;
            // const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            // If strictly global listener, we might want to capture everything.
            // But usually we don't want to interfere with normal typing.
            // Barcode scanners trigger very fast events.

            const now = Date.now();
            const timeDiff = now - lastKeyTime.current;

            if (timeDiff > timeThreshold) {
                // Reset buffer if typing is too slow (manual entry)
                buffer.current = "";
            }

            lastKeyTime.current = now;

            if (e.key === "Enter") {
                if (buffer.current.length >= minLength) {
                    onScan(buffer.current);
                    buffer.current = "";

                    // Prevent default enter behavior if it was a scan?
                    // e.preventDefault(); 
                }
            } else if (e.key.length === 1) {
                // Only printable characters
                buffer.current += e.key;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onScan, minLength, timeThreshold]);
}
