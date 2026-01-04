"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FlaskConical, Sparkles, Bug } from "lucide-react";

interface Release {
    version: string;
    date: string;
    title: string;
    description: string;
    changes: {
        type: "new" | "improvement" | "fix";
        text: string;
    }[];
}

const RELEASES: Release[] = [
    {
        version: "v4.2.0",
        date: "30 de Dezembro, 2026",
        title: "The Visual Experience Update",
        description: "Um redesign completo da experiência visual, focado em imersão e performance.",
        changes: [
            { type: "new", text: "Novo Cursor Interativo com efeito magnético e blend-mode." },
            { type: "new", text: "Modo Zen para visualização de relatórios em tela cheia." },
            { type: "improvement", text: "Transições de página fluidas (zero-flicker)." },
            { type: "improvement", text: "Sound Design sutil para feedback tátil." },
        ]
    },
    {
        version: "v4.1.0",
        date: "15 de Dezembro, 2026",
        title: "Premium Interactions",
        description: "Novos componentes interativos para elevar o nível da plataforma.",
        changes: [
            { type: "new", text: "Sticky Scroll Guide na landing page." },
            { type: "new", text: "Dark Mode aprimorado (Obsidian Slate)." },
            { type: "new", text: "Simulador de ROI na página inicial." },
            { type: "fix", text: "Correção de alinhamento na timeline." },
        ]
    },
    {
        version: "v4.0.0",
        date: "01 de Dezembro, 2026",
        title: "SIS DAVUS Reborn",
        description: "O lançamento oficial da versão 4.0, reconstruída do zero.",
        changes: [
            { type: "new", text: "Arquitetura Next.js 14 com Server Actions." },
            { type: "new", text: "Integração completa com Supabase Auth e DB." },
            { type: "new", text: "Novo Painel Administrativo com gráficos em tempo real." },
        ]
    }
];

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20">
            <div className="container max-w-4xl mx-auto px-4">

                {/* Header */}
                <div className="mb-20">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Voltar para Início
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4"
                    >
                        <div className="inline-flex items-center self-start px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Sparkles className="w-4 h-4 text-primary mr-2" />
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Changelog</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight">Evolução Contínua</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl">
                            Acompanhe todas as melhorias, correções e novidades que entregamos quinzenalmente no SIS DAVUS.
                        </p>
                    </motion.div>
                </div>

                {/* Timeline */}
                <div className="relative border-l border-border/50 ml-6 md:ml-10 space-y-20">
                    {RELEASES.map((release, i) => (
                        <motion.div
                            key={release.version}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pl-12 md:pl-16"
                        >
                            {/* Version Dot */}
                            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />

                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                                <span className="text-2xl font-bold font-mono">{release.version}</span>
                                <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground self-start">
                                    {release.date}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-3">{release.title}</h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                {release.description}
                            </p>

                            <div className="grid gap-3">
                                {release.changes.map((change, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                                        <div className="mt-0.5">
                                            {change.type === "new" && <Sparkles className="w-4 h-4 text-primary" />}
                                            {change.type === "improvement" && <FlaskConical className="w-4 h-4 text-chart-4" />}
                                            {change.type === "fix" && <Bug className="w-4 h-4 text-destructive" />}
                                        </div>
                                        <span className="text-sm">{change.text}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
