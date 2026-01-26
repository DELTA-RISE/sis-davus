"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, FileText, Loader2, Download, Upload, Type } from "lucide-react";
import { useElectron } from "@/hooks/use-electron";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanComplete?: (path: string) => void;
}

export function ScannerModal({ isOpen, onClose, onScanComplete }: ScannerModalProps) {
    const { scanDocument, openExternal, isElectron, importDocument, performOCR } = useElectron();
    const [fileName, setFileName] = useState("");
    const [scanning, setScanning] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [resultPath, setResultPath] = useState<string | null>(null);
    const [ocrText, setOcrText] = useState<string>("");
    const [activeTab, setActiveTab] = useState("scan");

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real browser env, we can't get full path easily due to security,
        // but in Electron with certain inputs or drag/drop we can.
        // However, standard <input type="file" /> gives us a File object.
        // To get the path in Electron renderer, we often need 'webUtils' or similar, 
        // OR we can just rely on the API. 
        // Actually, 'file.path' is exposed in Electron renderer for File objects!

        const path = (file as any).path;
        if (!path) {
            toast.error("Não foi possível ler o caminho do arquivo.");
            return;
        }

        setScanning(true);
        try {
            const res = await importDocument(path);
            if (res.success && res.path) {
                setResultPath(res.path);
                toast.success("Imagem importada com sucesso!");
                if (onScanComplete) onScanComplete(res.path);
            } else {
                toast.error("Erro na importação: " + res.error);
            }
        } finally {
            setScanning(false);
        }
    };

    const handleOCR = async () => {
        if (!resultPath) return;
        setOcrProcessing(true);
        try {
            const res = await performOCR(resultPath);
            if (res.success && res.text) {
                setOcrText(res.text);
                toast.success("Texto extraído com sucesso!");
            } else {
                toast.error("Erro no OCR: " + res.error);
            }
        } catch (e) {
            toast.error("Falha no OCR");
        } finally {
            setOcrProcessing(false);
        }
    };

    const handleScan = async () => {
        if (!fileName.trim()) {
            toast.error("Digite um nome para o arquivo.");
            return;
        }

        setScanning(true);
        setResultPath(null);

        try {
            const res = await scanDocument(fileName);
            if (res.success && res.path) {
                setResultPath(res.path);
                toast.success("Documento digitalizado com sucesso!");
                if (onScanComplete) onScanComplete(res.path);
            } else {
                toast.error("Erro na digitalização: " + (res.error || "Desconhecido"));
            }
        } catch (e) {
            console.error(e);
            toast.error("Falha ao comunicar com scanner.");
        } finally {
            setScanning(false);
        }
    };

    const handleOpen = () => {
        if (resultPath) openExternal(resultPath);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scan className="w-5 h-5" /> Digitalizar Documento
                    </DialogTitle>
                    <DialogDescription>
                        Utilize o scanner conectado para gerar um arquivo PDF.
                    </DialogDescription>
                </DialogHeader>

                {!isElectron ? (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                        Funcionalidade disponível apenas no App Desktop.
                    </div>
                ) : (
                    <div className="py-2">
                        <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="scan">Scanner</TabsTrigger>
                                <TabsTrigger value="import">Importar Imagem</TabsTrigger>
                            </TabsList>

                            <TabsContent value="scan" className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="filename">Nome do Arquivo</Label>
                                    <Input
                                        id="filename"
                                        placeholder="Ex: Contrato_Fornecedor_001"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        disabled={scanning}
                                    />
                                </div>
                                <Button onClick={handleScan} disabled={scanning || !fileName} className="w-full">
                                    {scanning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Digitalizando...
                                        </>
                                    ) : (
                                        <>
                                            <Scan className="w-4 h-4 mr-2" /> Iniciar Digitalização
                                        </>
                                    )}
                                </Button>
                            </TabsContent>

                            <TabsContent value="import" className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="file-upload">Selecione arquivo (Imagem, PDF, Excel, Word)</Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.pdf,.docx,.doc,.xlsx,.xls"
                                        onChange={handleImport}
                                        disabled={scanning}
                                    />
                                    <p className="text-xs text-muted-foreground">O arquivo será copiado para a galeria de documentos.</p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {resultPath && (
                            <div className="bg-muted p-3 rounded-md space-y-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm truncate max-w-[200px]">
                                        <FileText className="w-4 h-4" />
                                        <span className="truncate">{resultPath}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={handleOpen}>
                                        <Download className="w-4 h-4" /> Abrir
                                    </Button>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleOCR}
                                    className="w-full gap-2"
                                    disabled={ocrProcessing}
                                >
                                    {ocrProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Type className="w-3 h-3" />}
                                    Extrair Texto (OCR)
                                </Button>

                                {ocrText && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">Texto Extraído:</Label>
                                        <Textarea
                                            value={ocrText}
                                            readOnly
                                            className="h-24 text-xs font-mono bg-background"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button variant="ghost" onClick={onClose}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
