"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, Mail, MessageCircle, FileText, ExternalLink, Activity } from "lucide-react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function SupportPage() {
    const supportEmail = "suporte@davusengenharia.com.br";

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
                        <h1 className="text-2xl font-bold">Ajuda e Suporte</h1>
                        <p className="text-sm text-muted-foreground">
                            Tire suas dúvidas e entre em contato conosco
                        </p>
                    </div>
                </div>

                {/* Contact Card */}
                <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Mail className="h-5 w-5 text-green-500" />
                            </div>
                            <CardTitle className="text-lg">Fale com o Suporte</CardTitle>
                        </div>
                        <CardDescription>
                            Precisa de ajuda urgente ou encontrou um problema?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/50 p-4 rounded-xl border border-border/50">
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-sm font-medium mb-1">E-mail de Suporte Técnico</p>
                                <p className="text-lg font-bold text-primary break-all">{supportEmail}</p>
                            </div>
                            <Button
                                onClick={() => window.location.href = `mailto:${supportEmail}`}
                                className="whitespace-nowrap gap-2"
                            >
                                <Mail className="h-4 w-4" />
                                Enviar E-mail
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center md:text-left">
                            * Nosso tempo médio de resposta é de 24 horas úteis.
                        </p>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <HelpCircle className="h-5 w-5 text-purple-500" />
                            </div>
                            <CardTitle className="text-lg">Perguntas Frequentes (FAQ)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">

                            <AccordionItem value="item-1">
                                <AccordionTrigger>Como faço para alterar minha foto de perfil?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    O SIS DAVUS utiliza o <strong>Gravatar</strong> para gerenciar fotos de perfil.
                                    Para alterar sua imagem, crie ou acesse sua conta no <a href="https://gravatar.com" target="_blank" className="text-primary hover:underline">Gravatar.com</a> utilizando
                                    o mesmo e-mail cadastrado no sistema. A atualização pode levar alguns minutos para refletir aqui.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger>Esqueci minha senha, como recupero?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    Se você esqueceu sua senha e não consegue acessar o sistema, entre em contato imediatamente com o
                                    administrador do sistema ou envie um e-mail para nossa equipe de suporte. Por razões de segurança,
                                    recuperações de senha administrativas requerem verificação de identidade.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger>Como funcionam os níveis de acesso?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    <p className="mb-2">Existem dois níveis principais:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li><strong>Administrador:</strong> Acesso total ao sistema, incluindo cadastro de usuários e configurações globais.</li>
                                        <li><strong>Gestor:</strong> Acesso às funcionalidades operacionais (Patrimônio, Estoque, Relatórios), mas sem permissão de criar novos usuários.</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger>O sistema funciona offline?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    O SIS DAVUS foi projetado para funcionar prioritariamente online para garantir a integridade dos dados em tempo real.
                                    No entanto, algumas visualizações podem ser armazenadas em cache pelo seu navegador para acesso rápido.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-5">
                                <AccordionTrigger>Como exportar relatórios?</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    Vá até a aba <strong>Relatórios</strong> no menu lateral. Lá você encontrará opções para exportar dados
                                    em PDF e Excel (XLSX). Os relatórios podem ser personalizados por período e categoria.
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                    </CardContent>
                </Card>

                {/* Resources & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Manuals */}
                    <Card className="border-border/50 bg-card/50">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm">Manual do Usuário</h3>
                                <Link href="/perfil/suporte/manual" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                    Acessar Manual Online <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Status */}
                    <Card className="border-border/50 bg-card/50">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm">Status do Sistema</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs text-emerald-500 font-medium">Todos os sistemas operacionais</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
