import { GitBranch, Map } from "lucide-react";

export default function RoadmapPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-24 space-y-16">
            <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                    Roadmap
                </h1>
                <p className="text-xl text-white/60">
                    Como estamos evoluindo o sistema operacional das empresas do futuro.
                </p>
            </div>

            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">

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

function RoadmapItem({ q, title, desc, status }: { q: string, title: string, desc: string, status: 'done' | 'progress' | 'planned' }) {
    const colors = {
        done: "bg-green-500/20 text-green-400 border-green-500/30",
        progress: "bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse",
        planned: "bg-white/10 text-white/60 border-white/20"
    };

    return (
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${colors[status]}`}>
                {status === "done" && <GitBranch className="w-4 h-4" />}
                {status === "progress" && <Map className="w-4 h-4" />}
                {status === "planned" && <div className="w-2 h-2 rounded-full bg-white/40" />}
            </div>

            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${colors[status]}`}>
                        {q}
                    </span>
                    <span className="text-xs font-mono text-white/30 uppercase">{status}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-white/60 pb-2">{desc}</p>
            </div>
        </div>
    )
}
