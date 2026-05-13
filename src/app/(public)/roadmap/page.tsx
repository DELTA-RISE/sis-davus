import { GitBranch, Map } from "lucide-react";

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-24">
      <div className="space-y-6 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">
          Roadmap
        </h1>
        <p className="text-xl text-muted-foreground">
          Como estamos evoluindo o sistema operacional das empresas do futuro.
        </p>
      </div>

      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent md:before:mx-auto md:before:translate-x-0">
        <RoadmapItem
          q="Q1 2026"
          status="done"
          title="Nova Interface & Parallax Engine"
          desc="Refinamento focado em microinterações, glassmorphism e scrollytelling. Lançamento da v4 com sync em tempo real."
        />

        <RoadmapItem
          q="Q2 2026"
          status="progress"
          title="Módulo de Rastreio GPS Integrado"
          desc="Acompanhamento live-map de contêineres e frotas de entrega cruzada com o sistema de insumos."
        />

        <RoadmapItem
          q="Q3 2026"
          status="planned"
          title="Inteligência Analítica (AI)"
          desc="Módulo de machine learning processando os logs de consumo para sugerir cortes de gastos nas cadeias longas e projetar compras automáticas."
        />
      </div>
    </div>
  );
}

function RoadmapItem({
  q,
  title,
  desc,
  status,
}: {
  q: string;
  title: string;
  desc: string;
  status: "done" | "progress" | "planned";
}) {
  const colors = {
    done: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
    progress: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 animate-pulse",
    planned: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="group relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
      <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background md:order-1 md:group-even:translate-x-1/2 md:group-odd:-translate-x-1/2 ${colors[status]}`}>
        {status === "done" && <GitBranch className="h-4 w-4" />}
        {status === "progress" && <Map className="h-4 w-4" />}
        {status === "planned" && <div className="h-2 w-2 rounded-full bg-muted-foreground/60" />}
      </div>

      <div className="w-[calc(100%-4rem)] rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm md:w-[calc(50%-2.5rem)]">
        <div className="mb-2 flex items-center justify-between">
          <span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-widest ${colors[status]}`}>
            {q}
          </span>
          <span className="font-mono text-xs uppercase text-muted-foreground">{status}</span>
        </div>
        <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
        <p className="pb-2 text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
