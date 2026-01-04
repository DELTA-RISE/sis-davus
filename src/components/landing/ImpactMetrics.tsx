"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp, ShieldCheck, Clock } from "lucide-react";

const metrics = [
    {
        label: "Redução de Perdas",
        value: "98%",
        sub: "Inventário preciso em tempo real",
        icon: ShieldCheck,
        color: "text-green-500"
    },
    {
        label: "Tempo de Resposta",
        value: "< 50ms",
        sub: "Sincronização global instantânea",
        icon: Zap,
        color: "text-yellow-500"
    },
    {
        label: "ROI Médio",
        value: "3.5x",
        sub: "No primeiro ano de operação",
        icon: TrendingUp,
        color: "text-blue-500"
    },
    {
        label: "Uptime Garantido",
        value: "99.99%",
        sub: "Infraestrutura de alta disponibilidade",
        icon: Clock,
        color: "text-purple-500"
    }
];

export function ImpactMetrics() {
    return (
        <section className="py-32 px-4 relative z-10 border-y border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Impacto Real</h2>
                    <p className="text-white/60 text-xl max-w-2xl mx-auto">
                        Resultados mensuráveis para operações que não podem parar.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
                        >
                            <div className="mb-6 inline-flex p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                                <metric.icon className={`w-8 h-8 ${metric.color}`} />
                            </div>

                            <div className="space-y-2">
                                <h3 className={`text-5xl font-black tracking-tighter text-white group-hover:scale-105 transition-transform origin-left`}>
                                    {metric.value}
                                </h3>
                                <p className="text-lg font-bold text-white/90">{metric.label}</p>
                                <p className="text-sm text-white/50 leading-relaxed max-w-[200px]">
                                    {metric.sub}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
