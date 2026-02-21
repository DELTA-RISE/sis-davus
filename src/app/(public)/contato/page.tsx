"use client";

import { Mail, MapPin, MessageSquare } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function ContatoPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-24 space-y-24">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Lado Esquerdo - Info */}
                <div className="space-y-12">
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 leading-none">
                            Inicie o Contato.
                        </h1>
                        <p className="text-xl text-white/60 leading-relaxed max-w-md">
                            Estamos aqui para ajudar a migrar a complexidade da sua operação para um fluxo de dados limpo e criptografado.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5 text-white/60" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Email Geral</h4>
                                <p className="text-white/60">hello@davus.app</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Vendas / Enterprise</h4>
                                <p className="text-white/60">sales@davus.app</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-white/60" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Localização Operacional</h4>
                                <p className="text-white/60">Brasil (Distributed/Remote)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito - Form (Mock) */}
                <SpotlightCard className="p-8 md:p-12 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-xl">
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Modo de exibição. Formulário desativado nesta versão.'); }}>
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Nome Completo</label>
                            <input required type="text" className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="João Silva" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Email Corporativo</label>
                            <input required type="email" className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="joao@empresa.com" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/40 uppercase tracking-widest">Mensagem</label>
                            <textarea required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none" placeholder="Como podemos ajudar sua operação?"></textarea>
                        </div>

                        <MagneticButton size="lg" className="h-16 w-full text-lg rounded-xl gap-2 bg-primary text-black font-bold border-0 hover:bg-white transition-colors mt-4">
                            Enviar Mensagem Segura
                        </MagneticButton>
                    </form>
                </SpotlightCard>
            </div>

        </div>
    );
}
