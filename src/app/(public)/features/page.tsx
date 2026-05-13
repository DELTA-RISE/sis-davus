import { Box, Lock, Zap, RefreshCw, type LucideIcon } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-24">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">
          Módulos
        </h1>
        <p className="text-xl leading-relaxed text-muted-foreground">
          Tudo que você precisa para dominar sua operação física e digital em um único ecossistema integrado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <FeatureCard
          icon={Box}
          title="Gestão de Estoque Avançada"
          desc="Controle múltiplos depósitos, defina níveis críticos de curva ABC e faça inventários físicos com um clique usando o app mobile."
        />
        <FeatureCard
          icon={RefreshCw}
          title="Sync Bidirecional Offline"
          desc="Seus operadores de campo continuam trabalhando mesmo sem internet. Assim que a conexão volta, o PWA sincroniza tudo silenciosamente."
        />
        <FeatureCard
          icon={Lock}
          title="Controle de Acesso RBAC"
          desc="Defina permissões granulares. Quem pode aprovar compras? Quem pode apenas ver relatórios? Você tem o controle total em matrizes de acesso."
        />
        <FeatureCard
          icon={Zap}
          title="Automação de Alertas"
          desc="Não seja pego de surpresa. O sistema avisa via Push ou Email quando o estoque chega próximo ao mínimo vital da operação."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <SpotlightCard className="group rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm backdrop-blur-xl">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted text-foreground transition-all group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-foreground">{title}</h3>
      <p className="text-lg leading-relaxed text-muted-foreground">{desc}</p>
    </SpotlightCard>
  );
}
