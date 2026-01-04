"use client";

import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Globe } from "lucide-react";

const badges = [
    {
        icon: Shield,
        name: "LGPD Compliant",
        description: "Conformidade total com a Lei Geral de Proteção de Dados.",
    },
    {
        icon: Lock,
        name: "ISO 27001",
        description: "Segurança da informação e gestão de riscos.",
    },
    {
        icon: FileCheck,
        name: "SOC 2 Type II",
        description: "Controles rigorosos de segurança e disponibilidade.",
    },
    {
        icon: Globe,
        name: "Data Residency",
        description: "Dados armazenados localmente e criptografados.",
    },
];

export function TrustSection() {
    return (
        <section className="py-24 border-t border-border/40 bg-muted/10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Segurança Enterprise-Grade
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Sua segurança é nossa prioridade absoluta. O SIS DAVUS é construído seguindo os mais rigorosos padrões globais de conformidade.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <badge.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">{badge.name}</h3>
                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
