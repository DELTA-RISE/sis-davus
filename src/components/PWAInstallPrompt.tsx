"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Share, Plus, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    const userAgent = navigator.userAgent.toLowerCase();
    const ios = /ipad|iphone|ipod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    const android = /android/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);

    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show prompt for mobile devices after delay
    if (ios || android) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isStandalone || dismissed || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden animate-in slide-in-from-bottom-full duration-500">
      <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-chart-2/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                <span className="text-xl font-bold text-white">SD</span>
              </div>
              <div>
                <h3 className="font-bold text-base">Instalar SIS DAVUS</h3>
                <p className="text-xs text-muted-foreground">
                  Acesso rápido na tela inicial
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para instalar o aplicativo no seu iPhone/iPad:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Share className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">1. Toque em Compartilhar</p>
                    <p className="text-xs text-muted-foreground">No menu do Safari</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">2. Adicionar à Tela Inicial</p>
                    <p className="text-xs text-muted-foreground">Role para encontrar a opção</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          ) : isAndroid && !deferredPrompt ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para instalar o aplicativo no seu Android:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <MoreVertical className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">1. Toque no menu (⋮)</p>
                    <p className="text-xs text-muted-foreground">No canto superior do navegador</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Download className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">2. Instalar aplicativo</p>
                    <p className="text-xs text-muted-foreground">Ou &quot;Adicionar à tela inicial&quot;</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Funciona offline • Acesso rápido • Notificações
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="flex-1"
                >
                  Depois
                </Button>
                <Button
                  onClick={handleInstall}
                  className="flex-1 gap-2 shadow-lg shadow-primary/30"
                >
                  <Download className="h-4 w-4" />
                  Instalar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}