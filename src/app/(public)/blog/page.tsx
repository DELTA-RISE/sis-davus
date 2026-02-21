import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function BlogPage() {
    const posts = [
        { title: "Sincronização Bidirecional Offline: Como Funciona o Motor PWA do Davus", tag: "Engenharia", time: "8 min read" },
        { title: "Por que SOC-2 é o mínimo para sua próxima ferramenta de gestão", tag: "Segurança", time: "5 min read" },
        { title: "Case de Sucesso: Redução de 40% nas perdas de Inventário Físico na Delta Log", tag: "Cases", time: "12 min read" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 space-y-24">
            <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                    Inside Davus
                </h1>
                <p className="text-xl text-white/60 leading-relaxed max-w-2xl">
                    Arquitetura técnica, insights de operações físicas e cultura de engenharia da Delta Rise.
                </p>
            </div>

            <div className="space-y-6">
                {posts.map((post, i) => (
                    <SpotlightCard key={i} className="p-8 rounded-3xl bg-black/40 border border-white/10 hover:border-white/30 transition-all group flex flex-col justify-between gap-6 cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">{post.tag}</span>
                            <span className="text-sm text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {post.time}</span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/50 transition-all">
                            {post.title}
                        </h3>

                        <div className="mt-4 flex items-center gap-2 text-white/40 group-hover:text-primary transition-colors font-medium">
                            Ler Artigo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                    </SpotlightCard>
                ))}
            </div>
        </div>
    );
}
