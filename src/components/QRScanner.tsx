"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scannerId = "reader";

  useEffect(() => {
    let mounted = true;
    let scannerInstance: Html5Qrcode | null = null;

    if (!open) {
      // If closing, we rely on the cleanup function of the 'open' effect or separate cleanup logic needed?
      // Actually, if open changes to false, the previous effect cleanup runs.
      // So we mainly need to handle the 'true' case and its cleanup.
      return;
    }

    const initScanner = async () => {
      // Small delay to allow Dialog to mount and animation to finish
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!mounted) return;
      if (!document.getElementById(scannerId)) {
        console.error("Scanner element not found");
        return;
      }

      try {
        scannerInstance = new Html5Qrcode(scannerId);
        scannerRef.current = scannerInstance;

        await scannerInstance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1
          },
          (decodedText) => {
            if (mounted) {
              // Pause or stop before calling callback to prevent multiple scans
              // scannerInstance?.pause();
              onScan(decodedText);
              onOpenChange(false);
            }
          },
          () => {
            // ignore frame errors
          }
        );

        if (mounted) {
          setIsLoading(false);
        } else {
          // If unmounted during start, stop immediately
          await scannerInstance.stop();
          scannerInstance.clear();
        }
      } catch (err) {
        console.error("Failed to start scanner:", err);
        if (mounted) {
          setIsLoading(false);
          // Only show error if it's a real permission issue, not an interruption
          if (err instanceof Error && err.name === "NotAllowedError") {
            toast.error("Permissão de câmera negada.");
          }
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      // Cleanup function
      if (scannerRef.current) {
        const instance = scannerRef.current;
        scannerRef.current = null; // Prevent double cleanup

        // We check if it's scanning before stopping
        // Note: isScanning might be true even if start isn't fully resolved in some versions,
        // but generally safer to wrap in try/catch or promise chain.
        // The most reliable way with html5-qrcode is just calling stop() and catching errors.
        instance.stop()
          .then(() => instance.clear())
          .catch((err) => {
            console.warn("Failed to stop scanner during cleanup:", err);
            // Force clear if stop fails (e.g. wasn't running)
            try { instance.clear(); } catch (e) { }
          });
      }
    };
  }, [open, onScan, onOpenChange]);

  const handleManualInput = () => {
    const code = prompt("Digite o código do patrimônio:");
    if (code) {
      onScan(code);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-border bg-card"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 pb-0 items-center">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner de Patrimônio
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Aponte a câmera para o QR Code do patrimônio para escanear automaticamente.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
          <div id={scannerId} className="w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <RefreshCw className="h-10 w-10 animate-spin text-white" />
              <span className="sr-only">Iniciando câmera...</span>
            </div>
          )}

          {/* Overlay Guide */}
          {!isLoading && (
            <div className="absolute inset-0 pointer-events-none border-[50px] border-black/50">
              <div className="w-full h-full border-2 border-red-500 relative before:content-[''] before:absolute before:inset-0 before:bg-transparent" />
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <Button onClick={handleManualInput} variant="outline" className="w-full">
            Digitar código manualmente
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
