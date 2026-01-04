"use client";

import { Shield, Lock, Server, Key, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopTopBar } from "@/components/DesktopTopBar";
import { TopBar } from "@/components/TopBar";
import { MegaFooter } from "@/components/landing/MegaFooter";

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* MOCK NAV (Simulating logged out view for public page) */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-b border-border flex items-center px-6">
                <div className="font-bold text-xl">SIS <span className="text-primary">DAVUS</span> Security</div>
            </header>

            <main className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Shield className="w-4 h-4" />
                        Security Whitepaper
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                        Arquitetura de Segurança <br /> & Conformidade
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Visão técnica detalhada sobre como protegemos seus dados, garantimos disponibilidade e mantemos conformidade regulatória.
                    </p>
                </div>

                <div className="grid gap-12">
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Criptografia & Proteção de Dados</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                            <p>
                                Utilizamos criptografia de ponta a ponta para todos os dados sensíveis. Nossos protocolos incluem:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
                                <li><strong>AES-256 (GCM Mode)</strong> para criptografia de dados em repouso (At Rest).</li>
                                <li><strong>TLS 1.3</strong> para todos os dados em trânsito (In Transit).</li>
                                <li>Gestão de chaves via <strong>AWS KMS</strong> com rotação automática a cada 90 dias.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <Key className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Controle de Acesso (RBAC)</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                            <p>
                                O SIS DAVUS implementa um modelo rigoroso de Controle de Acesso Baseado em Função (RBAC):
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
                                <li><strong>Princípio do Menor Privilégio:</strong> Usuários têm acesso apenas ao necessário.</li>
                                <li><strong>MFA Obrigatório:</strong> Autenticação de dois fatores para todas as contas administrativas.</li>
                                <li><strong>Sessões Gerenciadas:</strong> Tokens JWT com tempo de vida curto e refresh tokens seguros (HttpOnly).</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Auditoria & Logs</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                            <p>
                                Rastreabilidade total é um pilar central. Mantemos logs imutáveis de todas as operações críticas:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
                                <li>Logs de acesso (quem acessou, quando e de onde).</li>
                                <li>Logs de mutação de dados (quem alterou, valor anterior e novo valor).</li>
                                <li>Retenção de logs por 5 anos conforme requisitos legais (LGPD/GDPR).</li>
                            </ul>
                        </div>
                    </section>

                    <div className="bg-card border border-border rounded-2xl p-8 mt-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Downloads & Certificações
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="outline" className="justify-start">Certificado ISO 27001 (PDF)</Button>
                            <Button variant="outline" className="justify-start">Relatório SOC 2 Type II (PDF)</Button>
                            <Button variant="outline" className="justify-start">Política de Privacidade (PDF)</Button>
                        </div>
                    </div>
                </div>
            </main>

            <MegaFooter />
        </div>
    );
}
