"use client";

import Link from "next/link";
import { WifiOff, RefreshCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-8 animate-pulse">
                <WifiOff className="w-10 h-10 text-muted-foreground" />
            </div>

            <h1 className="text-3xl font-black mb-4">Você está offline</h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                Parece que sua conexão com a internet caiu. O SIS DAVUS funciona melhor com conexão, mas você ainda pode acessar dados em cache.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    size="lg"
                    onClick={() => window.location.reload()}
                    className="gap-2"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Tentar Novamente
                </Button>

                <Link href="/dashboard">
                    <Button variant="outline" size="lg" className="gap-2 w-full">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Dashboard
                    </Button>
                </Link>
            </div>

            <div className="mt-12 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
                Código de Erro: NETWORK_UNAVAILABLE
            </div>
        </div>
    );
}
