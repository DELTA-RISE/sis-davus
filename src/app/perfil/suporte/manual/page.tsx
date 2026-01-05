"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, LayoutDashboard, Package, Box, FileBarChart, Settings, Search, QrCode } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserManualPage() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/perfil/suporte">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Manual do Usuário</h1>
                        <p className="text-sm text-muted-foreground">
                            Guia completo de utilização do SIS DAVUS
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Navigation Sidebar */}
                    <div className="hidden lg:block lg:col-span-1">
                        <Card className="sticky top-6 border-border/50 bg-card/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Índice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => scrollToSection('visao-geral')}>
                                    1. Visão Geral
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => scrollToSection('patrimonio')}>
                                    2. Gestão de Patrimônio
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => scrollToSection('estoque')}>
                                    3. Controle de Estoque
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => scrollToSection('relatorios')}>
                                    4. Relatórios
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => scrollToSection('configuracoes')}>
                                    5. Configurações
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Section 1: Overview */}
                        <section id="visao-geral" className="scroll-mt-20">
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <LayoutDashboard className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <CardTitle>1. Visão Geral do Sistema</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                    <p>
                                        O <strong>SIS DAVUS</strong> é sua central de comando para gestão patrimonial e de estoque.
                                        Ao fazer login, você será direcionado ao <strong>Dashboard Principal</strong>.
                                    </p>
                                    <div className="grid gap-2 pl-4 border-l-2 border-border">
                                        <p><strong className="text-foreground">Barra Lateral:</strong> Menu principal para navegação entre módulos.</p>
                                        <p><strong className="text-foreground">Barra Superior:</strong> Acesso rápido a busca (Ctrl+K), notificações e perfil.</p>
                                        <p><strong className="text-foreground">Cards de KPI:</strong> Resumo rápido de valores totais, baixas e itens críticos.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Section 2: Assets */}
                        <section id="patrimonio" className="scroll-mt-20">
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10">
                                            <Package className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <CardTitle>2. Gestão de Patrimônio</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                    <p>
                                        O módulo de Patrimônio permite o rastreamento completo de ativos permanentes da empresa.
                                    </p>

                                    <h3 className="font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
                                        <QrCode className="h-4 w-4" />
                                        Tags e QR Codes
                                    </h3>
                                    <p>
                                        Cada ativo cadastrado gera automaticamente um <strong>QR Code único</strong>.
                                        Você pode imprimir etiquetas diretamente pelo sistema para colar nos equipamentos.
                                        Ao escanear o código com a câmera do celular ou leitor, a ficha do ativo abre instantaneamente.
                                    </p>

                                    <h3 className="font-semibold text-foreground mt-4 mb-2">Check-in / Check-out</h3>
                                    <p>
                                        Para emprestar um equipamento a um colaborador, utilize a função de <strong>Checkout</strong>.
                                        Isso registra quem está com o ativo e a data prevista de devolução.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Section 3: Stock */}
                        <section id="estoque" className="scroll-mt-20">
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/10">
                                            <Box className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <CardTitle>3. Controle de Estoque</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                    <p>
                                        Gerencie itens de consumo (não-patrimoniais) como cabos, periféricos simples e material de escritório.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Alertas de Baixo Estoque:</strong> Itens abaixo do nível mínimo aparecem em destaque no Dashboard.</li>
                                        <li><strong>Movimentações:</strong> Registre todas as <strong>Entradas</strong> (compras) e <strong>Saídas</strong> (uso interno).</li>
                                        <li><strong>Histórico:</strong> Cada item possui um log detalhado de quem retirou ou adicionou quantidades.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Section 4: Reports */}
                        <section id="relatorios" className="scroll-mt-20">
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10">
                                            <FileBarChart className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <CardTitle>4. Relatórios e Auditoria</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                    <p>
                                        Transforme dados em insights. Na aba de Relatórios, você pode gerar documentos em PDF ou planilhas Excel.
                                    </p>
                                    <div className="bg-muted p-3 rounded-lg border border-border">
                                        <p className="font-medium text-foreground text-xs mb-1">Dica de Auditoria:</p>
                                        <p className="text-xs">
                                            O sistema possui um <strong>Log de Auditoria</strong> imutável (admin-only) que registra
                                            todas as ações críticas (criação, edição, exclusão) com data, hora e usuário responsável.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Section 5: Settings */}
                        <section id="configuracoes" className="scroll-mt-20">
                            <Card className="border-border/50 bg-card/50">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-zinc-500/10">
                                            <Settings className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <CardTitle>5. Configurações</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                    <p>
                                        Personalize sua experiência no menu <strong>Perfil</strong>.
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li><strong>Ajustes do App:</strong> Alterne entre Tema Claro/Escuro e ajuste a densidade da interface.</li>
                                        <li><strong>Segurança:</strong> Altere sua senha periodicamente.</li>
                                        <li><strong>Avatar:</strong> Sua foto é gerenciada automaticamente via Gravatar (baseado no seu e-mail).</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
