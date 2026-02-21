import { Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function CarreirasPage() {
    const jobs = [
        { title: "Senior Fullstack Engineer (Next.js/Supabase)", type: "Remoto (Brasil)", dep: "Engenharia" },
        { title: "Product Designer (UI/UX)", type: "Remoto (Global)", dep: "Design" },
        { title: "Engenheiro de Confiabilidade (SRE)", type: "Remoto (Brasil)", dep: "Infraestrutura" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 space-y-24">
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 mb-8">
                    <Briefcase className="w-10 h-10 text-white/80" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                    Carreiras
                </h1>
                <p className="text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
                    Junte-se ao time que está construindo a próxima geração de softwares de controle físico.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Vagas Abertas</h2>
                {jobs.map((job, i) => (
                    <SpotlightCard key={i} className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-white/30 transition-all group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer">
                        <div>
                            <div className="text-sm font-bold text-primary mb-2 uppercase tracking-widest">{job.dep}</div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/50 transition-all">{job.title}</h3>
                            <p className="text-white/40 text-sm">{job.type}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </div>
                    </SpotlightCard>
                ))}
            </div>
        </div>
    );
}
