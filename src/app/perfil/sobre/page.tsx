"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle2, Code2, Database, Palette, Heart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto pb-24 md:pb-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/perfil">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Sobre o Aplicativo</h1>
                        <p className="text-sm text-muted-foreground">
                            Informações técnicas e créditos
                        </p>
                    </div>
                </div>

                {/* Hero Section */}
                <Card className="border-border/50 bg-card overflow-hidden text-center py-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <CardContent className="flex flex-col items-center justify-center space-y-4 relative z-10">
                        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-2 shadow-inner">
                            <Shield className="h-12 w-12 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-primary">SIS DAVUS</h2>
                            <Badge variant="outline" className="mt-2 border-primary/20 bg-primary/5">
                                Versão 1.0.0 Stable
                            </Badge>
                        </div>
                        <p className="text-muted-foreground max-w-md mx-auto text-sm">
                            O Sistema Integrado de Gestão Patrimonial mais completo do mercado.
                            Desenvolvido para oferecer controle total, eficiência e segurança.
                        </p>
                    </CardContent>
                </Card>

                {/* Development Team */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-purple-500" />
                            Equipe de Desenvolvimento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                            <div className="space-y-1">
                                <p className="font-semibold text-sm">Desenvolvido por</p>
                                <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">DELTA RISE</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Engenharia de Software</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Design de Interface</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Arquitetura de Dados</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Segurança da Informação</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tech Stack */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-lg mb-2">Tecnologias Utilizadas</CardTitle>
                        <CardDescription>
                            Construído com o que há de mais moderno no desenvolvimento web.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border/50 text-center gap-2 hover:border-primary/50 transition-colors">
                            <div className="p-2 rounded-full bg-zinc-900 text-white">
                                <span className="font-bold text-xs">NEXT</span>
                            </div>
                            <span className="text-xs font-medium">Next.js 14</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border/50 text-center gap-2 hover:border-primary/50 transition-colors">
                            <div className="p-2 rounded-full bg-emerald-500 text-white">
                                <Database className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium">Supabase</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border/50 text-center gap-2 hover:border-primary/50 transition-colors">
                            <div className="p-2 rounded-full bg-cyan-500 text-white">
                                <Palette className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium">TailwindCSS</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border/50 text-center gap-2 hover:border-primary/50 transition-colors">
                            <div className="p-2 rounded-full bg-blue-500 text-white">
                                <span className="font-bold text-xs">TS</span>
                            </div>
                            <span className="text-xs font-medium">TypeScript</span>
                        </div>
                    </CardContent>
                </Card>

                <Footer />
            </div>
        </div>
    );
}

function Footer() {
    return (
        <div className="text-center py-6 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-70">
                <span>Feito com</span>
                <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
                <span>pela equipe Delta Rise</span>
            </div>
            <p className="text-[10px] text-muted-foreground opacity-50 uppercase tracking-widest">
                © 2026 Todos os direitos reservados
            </p>
        </div>
    )
}
