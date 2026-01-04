"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppSettingsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto pb-24 md:pb-8">

                <div className="flex items-center gap-4 mb-2">
                    <Link href="/perfil">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Ajustes do App</h1>
                        <p className="text-sm text-muted-foreground">Personalize sua experiência de uso</p>
                    </div>
                </div>

                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Modo TV (Business Intelligence)</CardTitle>
                                <CardDescription>
                                    Visualize métricas em tempo real sem distrações. Ideal para grandes monitores.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-xl text-sm space-y-2 border border-border/50">
                            <div className="flex items-center gap-2 font-medium">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <span>Funcionalidades ativas neste modo:</span>
                            </div>
                            <ul className="list-disc list-inside text-muted-foreground ml-1">
                                <li>Foco total em gráficos e KPIs</li>
                                <li>Atualização automática (60s)</li>
                                <li>Interface limpa (sem menus laterais)</li>
                                <li>Relógio integrado</li>
                            </ul>
                        </div>

                        <Button
                            className="w-full h-12 gap-2 text-base font-medium"
                            onClick={() => router.push('/dashboard/tv')}
                        >
                            <Monitor className="h-5 w-5" />
                            Ativar Modo TV Agora
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
