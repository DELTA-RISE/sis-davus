import { Briefcase, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function CarreirasPage() {
  const jobs = [
    { title: "Senior Fullstack Engineer (Next.js/Supabase)", type: "Remoto (Brasil)", dep: "Engenharia" },
    { title: "Product Designer (UI/UX)", type: "Remoto (Global)", dep: "Design" },
    { title: "Engenheiro de Confiabilidade (SRE)", type: "Remoto (Brasil)", dep: "Infraestrutura" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-24 px-4 py-24">
      <div className="space-y-6 text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-muted">
          <Briefcase className="h-10 w-10 text-foreground" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">
          Carreiras
        </h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground">
          Junte-se ao time que está construindo a próxima geração de softwares de controle físico.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="mb-8 border-b border-border pb-4 text-2xl font-bold text-foreground">Vagas Abertas</h2>
        {jobs.map((job) => (
          <SpotlightCard key={job.title} className="group flex cursor-pointer flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition-all hover:border-primary/40 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">{job.dep}</div>
              <h3 className="mb-1 text-xl font-bold text-foreground transition-colors group-hover:text-primary">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.type}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
