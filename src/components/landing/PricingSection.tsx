"use client";

import { Check } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/utils";

const tiers = [
    {
        name: "Starter",
        price: "R$ 499",
        description: "Para pequenas operações iniciando a digitalização.",
        features: [
            "Até 500 Ativos/Produtos",
            "2 Usuários",
            "Inventário QR Code Básico",
            "Suporte por Email"
        ],
        highlight: false
    },
    {
        name: "Pro",
        price: "R$ 1.299",
        description: "Para empresas em crescimento com múltiplas unidades.",
        features: [
            "Até 5.000 Ativos/Produtos",
            "10 Usuários",
            "Aplicativo Mobile Offline",
            "Gestão de Manutenção",
            "Suporte Prioritário 24/7"
        ],
        highlight: true
    },
    {
        name: "Enterprise",
        price: "Sob Consulta",
        description: "Soluções customizadas para grandes corporações.",
        features: [
            "Ativos Ilimitados",
            "Usuários Ilimitados",
            "Integração via API",
            "SLA Garantido (99.9%)",
            "Gerente de Conta Dedicado"
        ],
        highlight: false
    }
];

export function PricingSection() {
    return (
        <section className="py-24 px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Planos de Investimento
                    </h2>
                    <p className="text-white/60 text-xl max-w-2xl mx-auto">
                        Escolha a escala ideal para a sua operação. Transparência total, sem custos ocultos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={cn(
                                "relative p-8 rounded-[2rem] border transition-all duration-300 flex flex-col",
                                tier.highlight
                                    ? "bg-white/10 border-white/20 shadow-2xl shadow-primary/10 scale-105 z-20"
                                    : "bg-black/40 border-white/5 hover:border-white/10"
                            )}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-lg">
                                    Recomendado
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                                    {tier.price !== "Sob Consulta" && <span className="text-white/40">/mês</span>}
                                </div>
                                <p className="text-white/60 mt-4 text-sm leading-relaxed">
                                    {tier.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                                        <Check className="h-5 w-5 text-primary shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <MagneticButton
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold border transition-all",
                                    tier.highlight
                                        ? "bg-primary text-white border-primary hover:bg-primary/90"
                                        : "bg-transparent text-white border-white/20 hover:bg-white/5"
                                )}
                            >
                                {tier.name === "Enterprise" ? "Falar com Consultor" : "Começar Agora"}
                            </MagneticButton>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
