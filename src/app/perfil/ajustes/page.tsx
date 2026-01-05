"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Zap, Moon, Sun, Smartphone, Type, Grid, MoveHorizontal, Check } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AppSettingsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Preferences State
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [density, setDensity] = useState<'default' | 'compact'>('default');
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            // Load saved preferences
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
            const savedDensity = localStorage.getItem('density') as 'default' | 'compact';
            const savedMotion = localStorage.getItem('reduced-motion');

            if (savedTheme) setTheme(savedTheme);
            if (savedDensity) setDensity(savedDensity);
            if (savedMotion) setReducedMotion(savedMotion === 'true');
        }
    }, []);

    const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Apply theme logic
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(newTheme);
        }

        toast.success(`Tema definido para ${newTheme === 'system' ? 'Automático' : newTheme === 'dark' ? 'Escuro' : 'Claro'}`);
    };

    const updateDensity = (newDensity: 'default' | 'compact') => {
        setDensity(newDensity);
        localStorage.setItem('density', newDensity);
        // Density logic would normally involve toggling a class on body, e.g., 'density-compact'
        // For now we persist it.
        if (newDensity === 'compact') {
            document.body.classList.add('density-compact');
        } else {
            document.body.classList.remove('density-compact');
        }
        toast.success("Densidade da interface atualizada.");
    };

    const updateMotion = (isReduced: boolean) => {
        setReducedMotion(isReduced);
        localStorage.setItem('reduced-motion', String(isReduced));

        if (isReduced) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
        toast.success(isReduced ? "Animações reduzidas." : "Animações ativadas.");
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto pb-24 md:pb-8">

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

                {/* Appearance */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Sun className="h-5 w-5 text-indigo-500" />
                            </div>
                            <CardTitle className="text-lg">Aparência</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Tema</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => updateTheme('light')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-muted/50",
                                        theme === 'light' ? "border-primary bg-primary/5" : "border-muted bg-card"
                                    )}
                                >
                                    <Sun className="h-6 w-6" />
                                    <span className="text-xs font-medium">Claro</span>
                                </button>
                                <button
                                    onClick={() => updateTheme('dark')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-muted/50",
                                        theme === 'dark' ? "border-primary bg-primary/5" : "border-muted bg-card"
                                    )}
                                >
                                    <Moon className="h-6 w-6" />
                                    <span className="text-xs font-medium">Escuro</span>
                                </button>
                                <button
                                    onClick={() => updateTheme('system')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-muted/50",
                                        theme === 'system' ? "border-primary bg-primary/5" : "border-muted bg-card"
                                    )}
                                >
                                    <Smartphone className="h-6 w-6" />
                                    <span className="text-xs font-medium">Sistema</span>
                                </button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label>Densidade da Interface</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => updateDensity('default')}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:bg-muted/50 text-left",
                                        density === 'default' ? "border-primary bg-primary/5" : "border-muted bg-card"
                                    )}
                                >
                                    <Grid className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Padrão</p>
                                        <p className="text-[10px] text-muted-foreground">Espaçamento confortável</p>
                                    </div>
                                    {density === 'default' && <Check className="h-4 w-4 text-primary" />}
                                </button>
                                <button
                                    onClick={() => updateDensity('compact')}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:bg-muted/50 text-left",
                                        density === 'compact' ? "border-primary bg-primary/5" : "border-muted bg-card"
                                    )}
                                >
                                    <MoveHorizontal className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Compacto</p>
                                        <p className="text-[10px] text-muted-foreground">Mais dados na tela</p>
                                    </div>
                                    {density === 'compact' && <Check className="h-4 w-4 text-primary" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Accessibility */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <Zap className="h-5 w-5 text-emerald-500" />
                            </div>
                            <CardTitle className="text-lg">Acessibilidade</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="reduced-motion" className="flex flex-col space-y-1">
                                <span>Reduzir Movimento</span>
                                <span className="font-normal text-xs text-muted-foreground">Diminui animações e transições.</span>
                            </Label>
                            <Switch
                                id="reduced-motion"
                                checked={reducedMotion}
                                onCheckedChange={updateMotion}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* TV Mode (Existing) */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Monitor className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Modo TV (BI)</CardTitle>
                                <CardDescription>
                                    Visualização para grandes telas.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full h-10 gap-2 text-sm font-medium"
                            variant="secondary"
                            onClick={() => router.push('/dashboard/tv')}
                        >
                            <Monitor className="h-4 w-4" />
                            Ativar Modo TV
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
