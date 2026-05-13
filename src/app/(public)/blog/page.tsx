import { Clock, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function BlogPage() {
  const posts = [
    { title: "Sincronização Bidirecional Offline: Como Funciona o Motor PWA do Davus", tag: "Engenharia", time: "8 min read" },
    { title: "Por que SOC-2 é o mínimo para sua próxima ferramenta de gestão", tag: "Segurança", time: "5 min read" },
    { title: "Case de Sucesso: Redução de 40% nas perdas de Inventário Físico na Delta Log", tag: "Cases", time: "12 min read" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-24 px-4 py-24">
      <div className="space-y-6">
        <h1 className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">
          Inside Davus
        </h1>
        <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
          Arquitetura técnica, insights de operações físicas e cultura de engenharia da Delta Rise.
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <SpotlightCard key={post.title} className="group flex cursor-pointer flex-col justify-between gap-6 rounded-3xl border border-border bg-card/80 p-8 shadow-sm transition-all hover:border-primary/40">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold uppercase tracking-widest text-primary">{post.tag}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3 w-3" /> {post.time}</span>
            </div>

            <h3 className="text-2xl font-bold text-foreground transition-colors group-hover:text-primary md:text-3xl">
              {post.title}
            </h3>

            <div className="mt-4 flex items-center gap-2 font-medium text-muted-foreground transition-colors group-hover:text-primary">
              Ler Artigo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
