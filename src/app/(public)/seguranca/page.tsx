import { ShieldCheck, Server, KeyRound, Database } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function SecurityPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-24 space-y-24">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 mb-8">
                    <ShieldCheck className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                    Infraestrutura Militar
                </h1>
                <p className="text-xl text-white/60 leading-relaxed">
                    Sua operação é crítica. Construímos o Sis Davus com encriptação AES-256-GCM, políticas rigorosas de Row-Level Security e auditoria completa.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 flex gap-6 group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                        <Server className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Supabase Enterprise</h3>
                        <p className="text-white/60">Servidores globais com replicação assíncrona Point-in-Time Recovery (PITR). Restauramos seus dados a qualquer segundo dos últimos 30 dias.</p>
                    </div>
                </SpotlightCard>

                <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 flex gap-6 group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <KeyRound className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Autenticação MFA</h3>
                        <p className="text-white/60">Suporte nativo a Multiple Factor Auth (TOTP), Single Sign-On (SSO) SAMLv2 e políticas rígidas contra vazamentos em endpoints críticos.</p>
                    </div>
                </SpotlightCard>

                <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 flex gap-6 group md:col-span-2">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <Database className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Immutability Logs</h3>
                        <p className="text-white/60">Quem deletou, quando inseriu, de qual IP. Registramos até mesmo as visualizações em documentos sensíveis com painel gerencial dedicado.</p>
                    </div>
                </SpotlightCard>
            </div>
        </div>
    );
}
