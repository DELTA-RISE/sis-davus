"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { RealtimeManager } from "@/components/RealtimeManager";
import { processSyncQueue } from "@/lib/offline-sync";
import { supabase } from "@/lib/supabase";

const publicPaths = [
  "/",
  "/features",
  "/seguranca",
  "/roadmap",
  "/enterprise",
  "/sobre",
  "/carreiras",
  "/blog",
  "/contato",
  "/privacidade",
  "/termos",
  "/login",
  "/change-password",
];

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldSync = Boolean(
    pathname &&
    !publicPaths.includes(pathname) &&
    !pathname.startsWith("/wiki") &&
    !pathname.includes("/dashboard/tv")
  );

  useEffect(() => {
    const runSync = async () => {
      if (!shouldSync || !navigator.onLine) return;

      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      await processSyncQueue();
    };

    const handleOnline = () => {
      if (!shouldSync) return;

      toast.success("Conexão restabelecida", {
        description: "O SIS DAVUS verificará se existem alterações pendentes.",
      });
      runSync();
    };

    const handleOffline = () => {
      if (!shouldSync) return;

      toast.warning("Conexão indisponível", {
        description: "As próximas alterações serão salvas localmente até a reconexão.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    runSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [shouldSync]);

  return (
    <>
      <RealtimeManager />
      {children}
    </>
  );
}
