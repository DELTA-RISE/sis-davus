"use client";

import { useEffect, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Package,
    Building2,
    LogOut,
    AlertTriangle,
    Zap,
    Maximize2,
    Minimize2,
    ArrowLeft,
    Clock
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function TVDashboardPage() {
    const {
        products,
        assets,
        refreshData,
        lowStockProducts,
        pendingCheckouts,
        assetsInMaintenance,
        stockByCategory,
        movementsData
    } = useDashboardData();

    const [currentTime, setCurrentTime] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-refresh data every 60s
    useEffect(() => {
        const refresher = setInterval(() => {
            refreshData();
        }, 60000);
        return () => clearInterval(refresher);
    }, [refreshData]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
            {/* TV Header */}
            <header className="h-20 border-b border-border/50 bg-card/50 px-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Image src="/davus-logo.svg" alt="SIS DAVUS" width={40} height={40} className="w-10 h-10" />
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold leading-none tracking-tight">SIS DAVUS</h1>
                            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Modo TV • Monitoramento</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
                        <Clock className="h-5 w-5 text-primary animate-pulse" />
                        <span className="text-2xl font-mono font-bold tabular-nums">{currentTime}</span>
                    </div>
                    <Button variant="outline" onClick={toggleFullscreen} className="gap-2">
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        {isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}
                    </Button>
                </div>
            </header>

            {/* Content Grid */}
            <main className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-hidden">

                {/* Left Col - Stats */}
                <div className="col-span-3 space-y-6 flex flex-col h-full">
                    <Card className="flex-1 border-border/50 bg-card/40 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <CardContent className="p-8 relative z-10">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Total de Produtos</p>
                            <div className="flex items-center justify-between">
                                <span className="text-6xl font-black tracking-tighter tabular-nums">{products.length}</span>
                                <Package className="h-16 w-16 text-primary opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 border-border/50 bg-card/40 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-chart-5/5 group-hover:bg-chart-5/10 transition-colors" />
                        <CardContent className="p-8 relative z-10">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Patrimônios</p>
                            <div className="flex items-center justify-between">
                                <span className="text-6xl font-black tracking-tighter tabular-nums">{assets.length}</span>
                                <Building2 className="h-16 w-16 text-chart-5 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 border-border/50 bg-card/40 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                        <CardContent className="p-8 relative z-10">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Em Uso (Checkouts)</p>
                            <div className="flex items-center justify-between">
                                <span className="text-6xl font-black tracking-tighter tabular-nums">{pendingCheckouts.length}</span>
                                <LogOut className="h-16 w-16 text-amber-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 border-border/50 bg-card/40 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-destructive/5 group-hover:bg-destructive/10 transition-colors" />
                        <CardContent className="p-8 relative z-10">
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Alertas Ativos</p>
                            <div className="flex items-center justify-between">
                                <span className="text-6xl font-black tracking-tighter tabular-nums text-destructive">
                                    {lowStockProducts.length + assetsInMaintenance.length}
                                </span>
                                <AlertTriangle className="h-16 w-16 text-destructive opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center/Right - Charts */}
                <div className="col-span-9 grid grid-rows-2 gap-6 h-full">
                    <Card className="border-border/50 bg-card/40">
                        <CardHeader>
                            <CardTitle className="text-lg">Fluxo de Movimentações (7 Dias)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-4rem)]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={movementsData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                                    <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-6">
                        <Card className="border-border/50 bg-card/40">
                            <CardHeader>
                                <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[calc(100%-4rem)]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stockByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {stockByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/40">
                            <CardHeader>
                                <CardTitle className="text-lg">Alertas Recentes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
                                {lowStockProducts.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <span className="font-medium">{p.name}</span>
                                        <Badge variant="destructive">Estoque Baixo: {p.quantity}</Badge>
                                    </div>
                                ))}
                                {assetsInMaintenance.slice(0, 3).map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <span className="font-medium">{a.name}</span>
                                        <Badge className="bg-amber-500 text-black hover:bg-amber-600">Manutenção</Badge>
                                    </div>
                                ))}
                                {lowStockProducts.length === 0 && assetsInMaintenance.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                        <Zap className="h-8 w-8 mb-2 opacity-50" />
                                        <p>Tudo operando normalmente</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
