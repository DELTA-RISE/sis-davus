"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { RealtimeManager } from "@/components/RealtimeManager";
import { processSyncQueue } from "@/lib/offline-sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Conexão restabelecida", {
        description: "O SIS DAVUS verificará se existem alterações pendentes.",
      });
      processSyncQueue();
    };

    const handleOffline = () => {
      toast.warning("Conexão indisponível", {
        description: "As próximas alterações serão salvas localmente até a reconexão.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      processSyncQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      <RealtimeManager />
      {children}
    </>
  );
}
