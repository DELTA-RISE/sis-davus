import type React from "react";
import { ShieldCheck, Server, KeyRound, Database, type LucideIcon } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-24">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
          <ShieldCheck className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">
          Infraestrutura Segura
        </h1>
        <p className="text-xl leading-relaxed text-muted-foreground">
          Sua operação é crítica. Construímos o Sis Davus com criptografia AES-256-GCM, políticas rigorosas de Row-Level Security e auditoria completa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <SecurityCard icon={Server} accent="text-purple-500" title="Supabase Enterprise">
          Servidores globais com replicação assíncrona e Point-in-Time Recovery (PITR). Restauramos seus dados a qualquer segundo dos últimos 30 dias.
        </SecurityCard>

        <SecurityCard icon={KeyRound} accent="text-blue-500" title="Autenticação MFA">
          Suporte nativo a Multi-Factor Auth (TOTP), Single Sign-On (SSO) SAMLv2 e políticas rígidas contra vazamentos em endpoints críticos.
        </SecurityCard>

        <SecurityCard icon={Database} accent="text-orange-500" title="Logs Imutáveis" className="md:col-span-2">
          Quem deletou, quando inseriu, de qual IP. Registramos até mesmo as visualizações em documentos sensíveis com painel gerencial dedicado.
        </SecurityCard>
      </div>
    </div>
  );
}

function SecurityCard({
  icon: Icon,
  accent,
  title,
  className = "",
  children,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <SpotlightCard className={`group flex gap-6 rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm ${className}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
        <Icon className={`h-6 w-6 ${accent}`} />
      </div>
      <div>
        <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </SpotlightCard>
  );
}
