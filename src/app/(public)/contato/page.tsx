"use client";

import type React from "react";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-24">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl font-black leading-none tracking-tighter text-foreground md:text-7xl">
              Inicie o Contato.
            </h1>
            <p className="max-w-md text-xl leading-relaxed text-muted-foreground">
              Estamos aqui para ajudar a migrar a complexidade da sua operação para um fluxo de dados limpo e criptografado.
            </p>
          </div>

          <div className="space-y-8">
            <ContactItem icon={<Mail className="h-5 w-5" />} title="Email Geral" value="hello@deltarise.com" />
            <ContactItem
              icon={<MessageSquare className="h-5 w-5 text-orange-400" />}
              title="Vendas / Enterprise"
              value="sales@deltarise.com"
              accent
            />
            <ContactItem icon={<MapPin className="h-5 w-5" />} title="Localização Operacional" value="Brasil (Distributed/Remote)" />
          </div>
        </div>

        <SpotlightCard className="rounded-[2.5rem] border border-border bg-card/80 p-8 shadow-sm backdrop-blur-xl md:p-12">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Modo de exibição. Formulário desativado nesta versão.");
            }}
          >
            <FormField label="Nome Completo">
              <input
                required
                type="text"
                className="h-14 w-full rounded-xl border border-border bg-background px-4 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                placeholder="João Silva"
              />
            </FormField>

            <FormField label="Email Corporativo">
              <input
                required
                type="email"
                className="h-14 w-full rounded-xl border border-border bg-background px-4 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                placeholder="joao@empresa.com"
              />
            </FormField>

            <FormField label="Mensagem">
              <textarea
                required
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-background p-4 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                placeholder="Como podemos ajudar sua operação?"
              />
            </FormField>

            <MagneticButton size="lg" className="mt-4 h-16 w-full gap-2 rounded-xl border-0 bg-primary text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Enviar Mensagem Segura
            </MagneticButton>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}

function ContactItem({
  icon,
  title,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${accent ? "border-orange-500/20 bg-orange-500/10 text-orange-400" : "border-border bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
      <div>
        <h4 className="mb-1 font-bold text-foreground">{title}</h4>
        <p className="text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
