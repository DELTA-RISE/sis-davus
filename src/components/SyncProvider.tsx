"use client";

import { useEffect } from "react";

import { processSyncQueue } from "@/lib/offline-sync";
import { toast } from "sonner";

import { RealtimeManager } from "@/components/RealtimeManager";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Conexão restaurada! Sincronizando dados...");
      processSyncQueue();
    };

    const handleOffline = () => {
      toast.error("Você está offline. Alterações serão salvas localmente.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      processSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <RealtimeManager />
      {children}
    </>
  );
}
