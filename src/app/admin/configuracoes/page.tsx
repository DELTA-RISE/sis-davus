"use client";

import { useEffect, useState } from "react";
import { useElectron } from "@/hooks/use-electron";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Printer, Save } from "lucide-react";

export default function SettingsPage() {
    const { isElectron, getPrinters, print } = useElectron();
    const [printers, setPrinters] = useState<any[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isElectron) {
            loadPrinters();
            const saved = localStorage.getItem("sisdavus_printer_labels");
            if (saved) setSelectedPrinter(saved);
        } else {
            setLoading(false);
        }
    }, [isElectron]);

    const loadPrinters = async () => {
        try {
            const list = await getPrinters();
            setPrinters(list);

            // If no printer selected but we have a default system printer, try to pick it
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

    const handleSave = () => {
        localStorage.setItem("sisdavus_printer_labels", selectedPrinter);
        toast.success("Impressora padrão salva com sucesso");
    };

    const handleTestPrint = async () => {
        if (!selectedPrinter) {
            toast.error("Selecione uma impressora primeiro");
            return;
        }

        const toastId = toast.loading("Enviando para impressão...");

        // Simple HTML for test
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
                                As configurações de impressão direta e leitura de hardware estão disponíveis apenas na versão Desktop (Electron) do SisDavus.
                                Por favor, utilize o aplicativo instalado para acessar estes recursos.
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
                        Selecione a impressora térmica que será usada para imprimir etiquetas de patrimônio.
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
                                🔄
                            </Button>
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            A impressão será enviada diretamente para este dispositivo sem abrir janelas de confirmação.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button onClick={handleSave} className="gap-2">
                            <Save className="w-4 h-4" />
                            Salvar Preferência
                        </Button>
                        <Button onClick={handleTestPrint} variant="secondary">
                            Imprimir Teste
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
