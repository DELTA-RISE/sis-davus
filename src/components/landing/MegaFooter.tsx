"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Instagram, ArrowUpRight } from "lucide-react";

export function MegaFooter() {
    return (
        <footer className="relative min-h-[80vh] flex flex-col justify-between overflow-hidden bg-[#050505] pt-24 pb-8 px-4 border-t border-white/5">

            {/* MASSIVE BACKGROUND TEXT */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
                <h1 className="text-[15vw] md:text-[20vw] font-black text-white/[0.03] leading-none tracking-tighter">
                    DAVUS
                </h1>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex flex-col flex-1">

                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-auto">

                    <div className="lg:col-span-6 space-y-8">
                        <Link href="/" className="inline-block">
                            <span className="font-bold text-3xl tracking-tight text-white">
                                SIS <span className="text-primary">DAVUS</span>
                            </span>
                        </Link>
                        <p className="text-xl text-white/60 max-w-lg leading-relaxed">
                            A infraestrutura definitiva para operações físicas. Construímos o sistema operacional que o mundo real precisava.
                        </p>
                        <div className="flex gap-4">
                            <SocialLink icon={Twitter} href="#" />
                            <SocialLink icon={Github} href="#" />
                            <SocialLink icon={Linkedin} href="#" />
                            <SocialLink icon={Instagram} href="#" />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Produto</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#">Features</FooterLink>
                            <FooterLink href="#">Segurança</FooterLink>
                            <FooterLink href="#">Roadmap</FooterLink>
                            <FooterLink href="#">Enterprise</FooterLink>
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Empresa</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#">Sobre</FooterLink>
                            <FooterLink href="#">Carreiras</FooterLink>
                            <FooterLink href="#">Blog</FooterLink>
                            <FooterLink href="#">Contato</FooterLink>
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Legal</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#">Privacidade</FooterLink>
                            <FooterLink href="#">Termos</FooterLink>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/30">
                    <p>© {new Date().getFullYear()} Delta Rise Inc. Todos os direitos reservados.</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Todos os sistemas operacionais</span>
                    </div>
                </div>

            </div>
        </footer>
    );
}

function SocialLink({ icon: Icon, href }: { icon: any, href: string }) {
    return (
        <Link
            href={href}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group"
        >
            <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
    )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-white/60 hover:text-white transition-colors flex items-center gap-1 group">
                {children}
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1 translate-x-1 group-hover:translate-x-0 group-hover:translate-y-0" />
            </Link>
        </li>
    )
}
