"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

export default function AdminMaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/patrimonio/manutencao");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Redirecionando para manutenções</h1>
          <p className="text-sm text-muted-foreground">
            O acompanhamento e a gestão de status ficam na tela principal de manutenção.
          </p>
        </div>
      </div>
    </div>
  );
}
