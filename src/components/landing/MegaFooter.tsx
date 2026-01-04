"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function MegaFooter() {
    return (
        <footer className="relative bg-black text-white py-24 pb-12 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-12 mb-32">

                    <div className="space-y-8">
                        <h4 className="text-2xl font-bold">Sobre o Sistema</h4>
                        <p className="text-neutral-400 max-w-md text-lg leading-relaxed">
                            O <strong className="text-white">SIS DAVUS</strong> é a plataforma operacional exclusiva da Delta Rise.
                            O acesso é estritamente restrito a colaboradores autorizados e requer credenciais corporativas ativas.
                        </p>
                        <div className="flex gap-4 items-center text-sm text-neutral-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Versão 4.0.2 Stable
                        </div>
                    </div>

                    <div className="space-y-8 lg:pl-20">
                        <h4 className="text-2xl font-bold">Precisa de Acesso?</h4>
                        <p className="text-neutral-400 max-w-md leading-relaxed">
                            Caso você seja um colaborador e ainda não possua ou tenha perdido suas credenciais, entre em contato imediatamente com o administrador do sistema.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="mailto:admin@deltarise.com.br" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-neutral-200 transition-colors">
                                Contatar Admin
                            </a>
                            <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                                Área de Login
                            </Link>
                        </div>
                    </div>

                </div>

                <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-neutral-500 text-sm">
                        © {new Date().getFullYear()} Delta Rise Technology. Todos os direitos reservados.
                    </p>
                    <div className="flex gap-8">
                        <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Internal Use Only</span>
                    </div>
                </div>
            </div>

            {/* Massive Watermark */}
            <div className="absolute bottom-[-5vw] left-0 right-0 overflow-hidden pointer-events-none select-none">
                <motion.h1
                    initial={{ y: 100 }}
                    whileInView={{ y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-[25vw] leading-[0.8] font-black text-white/5 text-center tracking-tighter"
                >
                    DAVUS
                </motion.h1>
            </div>
        </footer>
    );
}
