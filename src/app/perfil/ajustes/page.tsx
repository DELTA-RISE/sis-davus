"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Zap, Moon, Sun, Smartphone, Grid, MoveHorizontal, Check, Printer, Scale, Scan, RefreshCw, Save, FolderOpen, Globe, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// import { useElectron } from "@/hooks/use-electron";
import { ScannerModal } from "@/components/ScannerModal";

interface PrinterDevice {
    name: string;
    displayName: string;
    isDefault: boolean;
}

interface SerialPortDevice {
    path: string;
    manufacturer: string;
}


export default function AppSettingsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Electron hooks removed
    const isElectron = false;
    const getPrinters = useCallback(async (): Promise<PrinterDevice[]> => [], []);
    const print = useCallback(async (_: string, __: string) => ({ success: false, error: "Not supported in web" }), []);
    // const getAutoLaunch = useCallback(async () => false, []);
    // const setAutoLaunch = async (_: boolean) => false; // Unused
    const getSerialPorts = useCallback(async (): Promise<SerialPortDevice[]> => [], []);
    const connectScale = useCallback(async (_: string) => ({ success: false, error: "Not supported in web" }), []);
    const disconnectScale = useCallback(async () => { }, []);
    const onScaleData = useCallback((_: (data: string) => void) => { }, []);

    // Preferences State
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [density, setDensity] = useState<'default' | 'compact'>('default');
    const [reducedMotion, setReducedMotion] = useState(false);

    // Hardware State
    const [printers, setPrinters] = useState<PrinterDevice[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const [serialPorts, setSerialPorts] = useState<SerialPortDevice[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>("");
    const [scaleConnected, setScaleConnected] = useState(false);
    const [currentWeight, setCurrentWeight] = useState<string>("0.000");
    const [loadingHardware, setLoadingHardware] = useState(true);
    // const [autoLaunch, setAutoLaunchState] = useState(false); // Unused
    const [scannerOpen, setScannerOpen] = useState(false);




    const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

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

    // Hardware Functions
    const loadPrinters = useCallback(async () => {
        try {
            const list = await getPrinters();
            setPrinters(list);
            if (!localStorage.getItem("sisdavus_printer_labels")) {
                const def = list.find((p) => p.isDefault);
                if (def) setSelectedPrinter(def.name);
            }
        } catch (e: unknown) {
            console.error(e);
            toast.error("Erro ao carregar impressoras");
        } finally {
            setLoadingHardware(false);
        }
    }, [getPrinters]);

    const loadPorts = useCallback(async () => {
        try {
            const ports = await getSerialPorts();
            setSerialPorts(ports || []);
        } catch (e: unknown) {
            console.error(e);
        }
    }, [getSerialPorts]);

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

        if (isElectron) {
            loadPrinters();
            loadPorts();
            // getAutoLaunch().then(setAutoLaunchState);

            const savedPrinter = localStorage.getItem("sisdavus_printer_labels");
            const savedPort = localStorage.getItem("sisdavus_scale_port");

            if (savedPrinter) setSelectedPrinter(savedPrinter);
            if (savedPort) setSelectedPort(savedPort);
        } else {
            setLoadingHardware(false);
        }
    }, [isElectron, loadPrinters, loadPorts]);

    const handleConnectScale = async () => {
        if (scaleConnected) {
            await disconnectScale();
            setScaleConnected(false);
            setCurrentWeight("0.000");
            toast.info("Balança desconectada");
            return;
        }

        if (!selectedPort) {
            toast.error("Selecione uma porta COM");
            return;
        }

        const res = await connectScale(selectedPort);
        if (res.success) {
            setScaleConnected(true);
            localStorage.setItem("sisdavus_scale_port", selectedPort);
            toast.success("Balança conectada!");
            onScaleData((data) => {
                setCurrentWeight(data);
            });
        } else {
            toast.error(`Erro ao conectar: ${res.error}`);
        }
    };

    const handleSavePrinter = () => {
        localStorage.setItem("sisdavus_printer_labels", selectedPrinter);
        toast.success("Impressora padrão salva com sucesso");
    };

    const handleTestPrint = async () => {
        if (!selectedPrinter) {
            toast.error("Selecione uma impressora primeiro");
            return;
        }

        const toastId = toast.loading("Enviando para impressão...");
        const html = `
            <div style="width: 300px; height: 150px; border: 2px solid black; padding: 10px; font-family: sans-serif; display: flex; align-items: center; justify-content: center; text-align: center;">
                <div>
                    <h1 style="margin: 0; font-size: 18px;">Teste SisDavus</h1>
                    <p style="margin: 5px 0 0 0; font-size: 12px;">Impressão via Electron</p>
                    <p style="margin: 5px 0 0 0; font-size: 10px;">${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;

        try {
            const result = await print(html, selectedPrinter);
            if (result.success) {
                toast.success("Teste enviado com sucesso!", { id: toastId });
            } else {
                toast.error("Falha na impressão: " + result.error, { id: toastId });
            }
        } catch (_: unknown) {
            toast.error("Erro ao comunicar com a impressora", { id: toastId });
        }
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
                        <p className="text-sm text-muted-foreground">Personalize sua experiência e configure dispositivos</p>
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

                {/* Regionalization */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/10">
                                <Globe className="h-5 w-5 text-pink-500" />
                            </div>
                            <CardTitle className="text-lg">Regionalização</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Formato de Data</Label>
                                <Select defaultValue="dd/mm/yyyy" onValueChange={(v) => localStorage.setItem('sisdavus_date_format', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o formato" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dd/mm/yyyy">DD/MM/AAAA (31/12/2026)</SelectItem>
                                        <SelectItem value="mm/dd/yyyy">MM/DD/AAAA (12/31/2026)</SelectItem>
                                        <SelectItem value="yyyy-mm-dd">AAAA-MM-DD (2026-12-31)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Moeda Padrão</Label>
                                <Select defaultValue="BRL" onValueChange={(v) => localStorage.setItem('sisdavus_currency', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a moeda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                                        <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                                        <SelectItem value="EUR">Euro (€)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dashboard Customization */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10">
                                <LayoutDashboard className="h-5 w-5 text-cyan-500" />
                            </div>
                            <CardTitle className="text-lg">Personalizar Dashboard</CardTitle>
                        </div>
                        <CardDescription>Escolha quais informações aparecem na sua tela inicial.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dash-stock" className="flex flex-col">
                                <span>Resumo de Estoque</span>
                                <span className="text-xs font-normal text-muted-foreground">Valores totais e itens críticos.</span>
                            </Label>
                            <Switch id="dash-stock" defaultChecked={true} onCheckedChange={(c) => localStorage.setItem('dash_widget_stock', String(c))} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dash-financial" className="flex flex-col">
                                <span>Métricas Financeiras</span>
                                <span className="text-xs font-normal text-muted-foreground">Gráficos de custos e depreciação.</span>
                            </Label>
                            <Switch id="dash-financial" defaultChecked={true} onCheckedChange={(c) => localStorage.setItem('dash_widget_financial', String(c))} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dash-alerts" className="flex flex-col">
                                <span>Alertas Recentes</span>
                                <span className="text-xs font-normal text-muted-foreground">Notificações de manutenção e validade.</span>
                            </Label>
                            <Switch id="dash-alerts" defaultChecked={true} onCheckedChange={(c) => localStorage.setItem('dash_widget_alerts', String(c))} />
                        </div>
                    </CardContent>
                </Card>

                {/* Hardware & System Settings - Only Visible in Electron or with Warning */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Integrações de Hardware</span>
                        <div className="h-px bg-border flex-1" />
                    </div>



                    {/* Printer Settings */}
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Printer className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Impressora de Etiquetas</CardTitle>
                                    <CardDescription>Para impressão rápida de QR Codes.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Dispositivo Padrão</Label>
                                <div className="flex gap-4">
                                    <Select value={selectedPrinter} onValueChange={setSelectedPrinter} disabled={loadingHardware}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione uma impressora" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {printers.map((p) => (
                                                <SelectItem key={p.name} value={p.name}>
                                                    {p.displayName || p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={loadPrinters} variant="outline" size="icon" title="Atualizar">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Perfil de Impressão</Label>
                                    <Select defaultValue="padrao">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Perfil" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="padrao">Padrão (100x50mm)</SelectItem>
                                            <SelectItem value="compacto">Compacto (50x25mm)</SelectItem>
                                            <SelectItem value="patrimonio">Patrimônio (Metalizado)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Densidade (DPI)</Label>
                                    <Select defaultValue="203">
                                        <SelectTrigger>
                                            <SelectValue placeholder="DPI" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="203">203 DPI (Normal)</SelectItem>
                                            <SelectItem value="300">300 DPI (Alta)</SelectItem>
                                            <SelectItem value="600">600 DPI (Ultra)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button onClick={handleSavePrinter} className="gap-2 flex-1" size="sm">
                                    <Save className="w-4 h-4" /> Salvar
                                </Button>
                                <Button onClick={handleTestPrint} variant="secondary" className="gap-2 flex-1" size="sm">
                                    <Printer className="w-4 h-4" /> Testar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scale Settings */}
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Scale className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Balança (Serial/USB)</CardTitle>
                                    <CardDescription>Leitura automática de peso.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Porta COM</Label>
                                <div className="flex gap-4">
                                    <Select value={selectedPort} onValueChange={setSelectedPort} disabled={scaleConnected}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione a porta (ex: COM3)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {serialPorts.map((p) => (
                                                <SelectItem key={p.path} value={p.path}>
                                                    {p.path} - {p.manufacturer || 'Genérico'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={loadPorts} variant="outline" size="icon" disabled={scaleConnected}>
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Peso Atual</span>
                                    <span className="text-2xl font-mono font-bold text-primary">{currentWeight} kg</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => toast.info("Iniciando calibração de tara...")}>
                                        Tarar
                                    </Button>
                                    <Button
                                        onClick={handleConnectScale}
                                        variant={scaleConnected ? "destructive" : "default"}
                                        size="sm"
                                    >
                                        {scaleConnected ? "Desconectar" : "Conectar"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scanner */}
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Scan className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Scanner de Documentos</CardTitle>
                                    <CardDescription>Digitalização direta para a galeria.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button onClick={() => setScannerOpen(true)} className="w-full gap-2" variant="outline">
                                <Scan className="w-4 h-4" />
                                Abrir Interface de Digitalização
                            </Button>
                            <Button asChild className="w-full gap-2" variant="ghost">
                                <Link href="/documentos">
                                    <FolderOpen className="w-4 h-4" />
                                    Ver Galeria de Documentos
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>


                </div>

                <div className="flex items-center gap-2 px-1 pt-6">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Outras Preferências</span>
                    <div className="h-px bg-border flex-1" />
                </div>

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

                {/* TV Mode */}
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

                <ScannerModal
                    isOpen={scannerOpen}
                    onClose={() => setScannerOpen(false)}
                />
            </div>

        </div>
    );
}
