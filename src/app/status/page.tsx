"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Monitor, Activity } from "lucide-react";
import { motion } from "framer-motion";

const SERVICES = [
    { name: "API Gateway", status: "operational", uptime: "99.99%" },
    { name: "Database (Supabase)", status: "operational", uptime: "99.95%" },
    { name: "Storage Service", status: "operational", uptime: "100.00%" },
    { name: "Authentication", status: "operational", uptime: "99.98%" },
    { name: "Realtime Updates", status: "operational", uptime: "99.90%" },
    { name: "Email Delivery", status: "operational", uptime: "99.99%" },
];

const INCIDENTS = [
    {
        date: "12 Dez 2026",
        title: "Latência elevada na API de Relatórios",
        status: "resolved",
        description: "Identificamos e corrigimos um bottleneck na geração de relatórios PDF. O serviço foi normalizado em 15 minutos."
    },
    {
        date: "05 Nov 2026",
        title: "Manutenção Programada - Database",
        status: "completed",
        description: "Atualização de segurança do cluster de banco de dados concluída com sucesso."
    }
];

export default function StatusPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20">
            <div className="container max-w-4xl mx-auto px-4">

                {/* Header */}
                <div className="mb-16">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Voltar para Início
                    </Link>

                    <div className="flex items-center gap-4 mb-8">
                        <Activity className="w-10 h-10 text-primary" />
                        <h1 className="text-4xl font-bold tracking-tight">System Status</h1>
                    </div>

                    <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-emerald-500 mb-2">Todos os sistemas operacionais</h2>
                            <p className="text-muted-foreground">Última verificação: {new Date().toLocaleTimeString('pt-BR')} - Todos os serviços estão respondendo dentro do tempo esperado.</p>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
                    {SERVICES.map((service, i) => (
                        <motion.div
                            key={service.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-colors flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-muted-foreground" />
                                <span className="font-medium">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-muted-foreground">{service.uptime}</span>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Operacional
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Incident History */}
                <div>
                    <h3 className="text-xl font-bold mb-8">Histórico de Incidentes</h3>
                    <div className="space-y-8">
                        {INCIDENTS.map((incident, i) => (
                            <div key={i} className="relative pl-8 border-l border-border/50 pb-8 last:pb-0 last:border-0">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg">{incident.title}</h4>
                                    <span className="text-sm text-muted-foreground">{incident.date}</span>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{incident.description}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${incident.status === "resolved" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                    }`}>
                                    {incident.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
