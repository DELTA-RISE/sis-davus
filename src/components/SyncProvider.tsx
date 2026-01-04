"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { processSyncQueue } from "@/lib/offline-sync";
import { toast } from "sonner";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Conexão restaurada! Sincronizando dados...");
      processSyncQueue(supabase);
    };

    const handleOffline = () => {
      toast.error("Você está offline. Alterações serão salvas localmente.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      processSyncQueue(supabase);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}
