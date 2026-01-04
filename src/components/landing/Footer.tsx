"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, Instagram } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-3">
                            <span className="font-bold text-xl tracking-tight text-white">
                                SIS <span className="text-primary">DAVUS</span>
                            </span>
                        </Link>
                        <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                            Transformando o controle de ativos físicos em inteligência digital.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Produto</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Preços</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Segurança</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Empresa</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li><Link href="#" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Carreiras</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Contato</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacidade</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Termos</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Compliance</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/30 text-xs">
                        © {new Date().getFullYear()} SIS DAVUS. Todos os direitos reservados.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className="text-white/40 hover:text-white transition-colors"><Twitter className="h-4 w-4" /></Link>
                        <Link href="#" className="text-white/40 hover:text-white transition-colors"><Github className="h-4 w-4" /></Link>
                        <Link href="#" className="text-white/40 hover:text-white transition-colors"><Linkedin className="h-4 w-4" /></Link>
                        <Link href="#" className="text-white/40 hover:text-white transition-colors"><Instagram className="h-4 w-4" /></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
