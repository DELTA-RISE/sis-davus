"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useElectron } from "@/hooks/use-electron";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Printer, Save, Power, Scale, RefreshCw, Scan, FolderOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScannerModal } from "@/components/ScannerModal";

export default function SettingsPage() {
    const {
        isElectron,
        getPrinters,
        print,
        getAutoLaunch,
        setAutoLaunch,
        getSerialPorts,
        connectScale,
        disconnectScale,
        onScaleData
    } = useElectron();

    // Printer State
    const [printers, setPrinters] = useState<any[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");

    // Scale State
    const [serialPorts, setSerialPorts] = useState<any[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>("");
    const [scaleConnected, setScaleConnected] = useState(false);
    const [currentWeight, setCurrentWeight] = useState<string>("0.000");

    // System State
    const [loading, setLoading] = useState(true);
    const [autoLaunch, setAutoLaunchState] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        if (isElectron) {
            loadPrinters();
            loadPorts();
            getAutoLaunch().then(setAutoLaunchState);

            const savedPrinter = localStorage.getItem("sisdavus_printer_labels");
            const savedPort = localStorage.getItem("sisdavus_scale_port");

            if (savedPrinter) setSelectedPrinter(savedPrinter);
            if (savedPort) setSelectedPort(savedPort);
        } else {
            setLoading(false);
        }
    }, [isElectron]);

    const loadPrinters = async () => {
        try {
            const list = await getPrinters();
            setPrinters(list);

            if (!localStorage.getItem("sisdavus_printer_labels")) {
                const def = list.find(p => p.isDefault);
                if (def) setSelectedPrinter(def.name);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar impressoras");
        } finally {
            setLoading(false);
        }
    };

    const loadPorts = async () => {
        try {
            const ports = await getSerialPorts();
            setSerialPorts(ports || []);
        } catch (e) {
            console.error(e);
            // toast.error("Erro ao listar portas seriais"); // Fail silently if no support
        }
    };

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

            // Listen to data
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
        } catch (e) {
            toast.error("Erro ao comunicar com a impressora", { id: toastId });
        }
    };

    if (!isElectron) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Integração de Hardware</CardTitle>
                        <CardDescription>Configurações de dispositivos e impressoras.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
                            <p className="font-medium">Modo Web Detectado</p>
                            <p className="text-sm mt-1">
                                As configurações de impressão direta, leitura de balança e inicialização estão disponíveis apenas na versão Desktop (Electron).
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Configurações do Dispositivo</h1>
                <p className="text-muted-foreground">Gerencie impressoras e comportamento do aplicativo Desktop.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        Impressora de Etiquetas
                    </CardTitle>
                    <CardDescription>
                        Selecione a impressora térmica que será usada para imprimir etiquetas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="printer-select">Impressora Padrão</Label>
                        <div className="flex gap-4">
                            <Select value={selectedPrinter} onValueChange={setSelectedPrinter} disabled={loading}>
                                <SelectTrigger className="w-[300px]">
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
                            <Button onClick={loadPrinters} variant="outline" size="icon" title="Atualizar lista">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            A impressão será enviada diretamente para este dispositivo sem abrir janelas de confirmação.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button onClick={handleSavePrinter} className="gap-2">
                            <Save className="w-4 h-4" />
                            Salvar Preferência
                        </Button>
                        <Button onClick={handleTestPrint} variant="secondary">
                            Imprimir Teste
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Balança
                    </CardTitle>
                    <CardDescription>
                        Conecte uma balança via porta Serial/USB para captura de peso.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Porta de Comunicação (COM)</Label>
                        <div className="flex gap-4">
                            <Select value={selectedPort} onValueChange={setSelectedPort} disabled={scaleConnected}>
                                <SelectTrigger className="w-[300px]">
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
                            <Button onClick={loadPorts} variant="outline" size="icon" title="Atualizar portas" disabled={scaleConnected}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="justify-center flex flex-col items-center w-full gap-2">
                            <div className="text-sm font-medium text-muted-foreground">PESO ATUAL</div>
                            <div className="text-4xl font-mono font-bold tracking-wider text-primary">
                                {currentWeight} <span className="text-lg font-sans text-muted-foreground">kg</span>
                            </div>
                        </div>
                        <div className="border-l pl-4 ml-4">
                            <Button
                                onClick={handleConnectScale}
                                variant={scaleConnected ? "destructive" : "default"}
                                className="w-full"
                            >
                                {scaleConnected ? "Desconectar" : "Conectar"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scan className="w-5 h-5" />
                        Digitalização de Documentos
                    </CardTitle>
                    <CardDescription>
                        Digitalize documentos e contratos diretamente para PDF.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button onClick={() => setScannerOpen(true)} className="w-full gap-2" variant="outline">
                        <Scan className="w-4 h-4" />
                        Abrir Digitalizador
                    </Button>
                    <Button asChild className="w-full gap-2" variant="secondary">
                        <Link href="/documentos">
                            <FolderOpen className="w-4 h-4" />
                            Ver Galeria de Documentos
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Power className="w-5 h-5" />
                        Inicialização do Sistema
                    </CardTitle>
                    <CardDescription>
                        Configure como o SisDavus se comporta ao iniciar o Windows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="auto-launch"
                            checked={autoLaunch}
                            onCheckedChange={async (checked) => {
                                await setAutoLaunch(checked);
                                setAutoLaunchState(checked);
                                toast.success(`Inicialização automática ${checked ? 'ativada' : 'desativada'}`);
                            }}
                        />
                        <Label htmlFor="auto-launch">Iniciar SisDavus ao ligar o computador</Label>
                    </div>
                </CardContent>
            </Card>

            <ScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
            />
        </div >
    );
}
