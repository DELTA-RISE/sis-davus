import { Building2, PhoneCall } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import Link from "next/link";

export default function EnterprisePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-32">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-orange-500">
            Para Operações Massivas
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tighter text-foreground md:text-7xl">
            Escala sem <br />Limites.
          </h1>
          <p className="max-w-lg text-xl leading-relaxed text-muted-foreground">
            A infraestrutura Enterprise do Davus é separada. Tenants dedicados (Single-tenant), integrações via APIs customizadas, SSO, ERP Connectors e SLA garantido de 99.99%.
          </p>

          <div className="flex gap-4 pt-4">
            <Link href="/contato">
              <MagneticButton size="xl" className="h-16 gap-2 rounded-2xl border-0 bg-primary px-8 font-semibold text-primary-foreground">
                <PhoneCall className="h-5 w-5" />
                Falar com Vendas
              </MagneticButton>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[3rem] border border-border bg-card/80 md:aspect-video lg:aspect-square">
            <div className="absolute h-40 w-40 rounded-full bg-orange-500/10 blur-[80px]" />
            <Building2 className="relative z-10 h-32 w-32 text-muted-foreground/30" strokeWidth={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
