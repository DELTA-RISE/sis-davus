"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
    Package,
    Building2,
    ArrowLeftRight,
    QrCode,
    Shield,
    Smartphone,
    X,
    Play
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpotlightCard } from "./SpotlightCard";

const features = [
    {
        icon: Package,
        title: "Controle Total de Inventário",
        description: "Rastreamento em tempo real de cada ativo, desde a aquisição até o descarte. Histórico completo de movimentações.",
        size: "large",
        video: "inventory-demo", // Placeholder
    },
    {
        icon: Building2,
        title: "Gestão Multi-Unidades",
        description: "Gerencie múltiplas filiais e centros de custo em uma única plataforma unificada.",
        size: "small",
        video: "multi-unit-demo",
    },
    {
        icon: ArrowLeftRight,
        title: "Movimentações Inteligentes",
        description: "Processos de transferência facilitados com aprovação digital e rastreabilidade total.",
        size: "small",
        video: "transfer-demo",
    },
    {
        icon: QrCode,
        title: "Tecnologia QR Code",
        description: "Identificação rápida e auditorias ágeis usando etiquetas QR Code duráveis.",
        size: "small",
        video: "qrcode-demo",
    },
    {
        icon: Shield,
        title: "Segurança e Auditoria",
        description: "Logs detalhados de todas as ações e níveis de permissão granulares por usuário.",
        size: "large",
        video: "security-demo",
    },
    {
        icon: Smartphone,
        title: "App Mobile (PWA)",
        description: "Acesse de qualquer lugar. Realize auditorias e consultas diretamente pelo celular.",
        size: "small",
        video: "mobile-demo",
    },
];

export function BentoGrid() {
    const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

    return (
        <section id="features" className="py-24 px-4 bg-muted/20">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                        Tudo o que você precisa em <span className="text-primary">um só lugar</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Uma suíte completa de ferramentas projetada para resolver os desafios reais da gestão de patrimônio da Delta Rise.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px]">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`${feature.size === "large" ? "md:col-span-2" : "md:col-span-1"}`}
                        >
                            <SpotlightCard
                                onClick={() => setSelectedFeature(feature)}
                                className="h-full cursor-pointer hover:shadow-2xl transition-shadow duration-500 group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                            {feature.description}
                                        </p>
                                        <div className="flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                            <Play className="w-3 h-3 mr-1 fill-current" /> Ver Detalhes
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                            </SpotlightCard>
                        </motion.div>
                    ))}
                </div>

                {/* Detail Modal */}
                <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
                    <DialogContent className="max-w-3xl bg-card/90 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
                        {selectedFeature && (
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="w-full md:w-1/2 bg-muted flex items-center justify-center p-12 relative overflow-hidden">
                                    {/* Placeholder for Video/Image */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-chart-4/10 opacity-50 animate-pulse-slow" />
                                    <div className="relative z-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-background/50 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-4">
                                            <selectedFeature.icon className="w-10 h-10 text-primary" />
                                        </div>
                                        <p className="text-xs font-mono text-muted-foreground uppercase">Preview do Recurso</p>
                                    </div>
                                </div>

                                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold mb-4">{selectedFeature.title}</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-muted-foreground leading-relaxed mb-8">
                                        {selectedFeature.description}
                                        <br /><br />
                                        Este módulo permite controle absoluto sobre os fluxos operacionais, garantindo conformidade com as normas internas da Delta Rise.
                                    </p>

                                    <div className="mt-auto">
                                        <button
                                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                                            onClick={() => setSelectedFeature(null)}
                                        >
                                            Entendi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}
