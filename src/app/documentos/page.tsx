"use client";

import { useEffect, useState, useCallback } from "react";
// import { useElectron } from "@/hooks/use-electron";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Scan, RefreshCw, FolderOpen, Search, Download, Trash2, Link as LinkIcon, SortAsc, SortDesc, FileSpreadsheet, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScannerModal } from "@/components/ScannerModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface ScannedDoc {
    name: string;
    path: string;
    size: number;
    createdAt: Date;
}

type SortOption = "date" | "name" | "size";
type SortDirection = "asc" | "desc";

export default function DocumentsPage() {
    // Electron hooks removed
    const isElectron = false;
    const listScannedDocuments = async (): Promise<ScannedDoc[]> => [];
    const openExternal = (_: string) => { };
    const renameDocument = async (_: string, __: string) => ({ success: false, error: "Not supported in web" });
    const deleteDocument = async (_: string) => ({ success: false, error: "Not supported in web" });
    const [documents, setDocuments] = useState<ScannedDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [scannerOpen, setScannerOpen] = useState(false);

    // Selection & Actions
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [assetCode, setAssetCode] = useState("");
    const [deletePaths, setDeletePaths] = useState<string[]>([]);

    // Sorting
    const [sortBy, setSortBy] = useState<SortOption>("date");
    const [sortDir, setSortDir] = useState<SortDirection>("desc");

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const docs = await listScannedDocuments();
            const processed = docs.map(d => ({
                ...d,
                createdAt: new Date(d.createdAt)
            }));
            setDocuments(processed);
            setSelectedPaths(new Set()); // Clear selection on reload
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isElectron) {
            loadDocuments();
        } else {
            setLoading(false);
        }
    }, [isElectron, loadDocuments]);

    const handleDelete = async (pathsToDelete: string[]) => {
        let successCount = 0;
        for (const path of pathsToDelete) {
            const res = await deleteDocument(path);
            if (res.success) successCount++;
        }

        if (successCount > 0) {
            toast.success(`${successCount} arquivos excluídos.`);
            loadDocuments();
            setSelectedPaths(new Set());
        } else {
            toast.error("Erro ao excluir arquivos.");
        }
        setDeletePaths([]);
    };



    const handleOpen = (path: string) => {
        openExternal(path);
    };

    const toggleSelection = (path: string) => {
        const newSet = new Set(selectedPaths);
        if (newSet.has(path)) {
            newSet.delete(path);
        } else {
            newSet.add(path);
        }
        setSelectedPaths(newSet);
    };

    const handleLinkToAsset = async (mode: 'link' | 'unlink' = 'link') => {
        if (mode === 'link' && !assetCode) {
            toast.error("Digite o código do patrimônio.");
            return;
        }

        let successCount = 0;
        const regex = /^\[.*?\]\s*/; // Matches [CODE] prefix

        for (const path of selectedPaths) {
            const doc = documents.find(d => d.path === path);
            if (!doc) continue;

            const currentName = doc.name;
            let newName = currentName;

            if (mode === 'unlink') {
                if (!regex.test(currentName)) continue; // Not linked
                newName = currentName.replace(regex, "");
            } else {
                // Link mode
                // Remove existing tag first if present to avoid [NEW][OLD]
                const cleanName = currentName.replace(regex, "");
                newName = `[${assetCode}] ${cleanName}`;
            }

            if (newName !== currentName) {
                const res = await renameDocument(doc.path, newName);
                if (res.success) {
                    successCount++;
                } else {
                    console.error(`Falha ao processar ${doc.name}: ${res.error}`);
                }
            }
        }

        if (successCount > 0) {
            toast.success(mode === 'link'
                ? `${successCount} arquivos vinculados ao código ${assetCode}!`
                : `${successCount} arquivos desvinculados com sucesso!`
            );
            setLinkDialogOpen(false);
            setAssetCode("");
            loadDocuments();
        } else {
            toast.info("Nenhuma alteração necessária.");
            setLinkDialogOpen(false);
        }
    };

    const getFileIcon = (name: string) => {
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="w-16 h-16 text-green-600/40 group-hover:text-green-600 transition-colors" />;
        if (name.endsWith('.pdf')) return <FileText className="w-16 h-16 text-red-600/40 group-hover:text-red-600 transition-colors" />;
        return <File className="w-16 h-16 text-muted-foreground/40 group-hover:text-primary transition-colors" />;
    };

    // Filter & Sort Logic
    const filtered = documents
        .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            let res = 0;
            if (sortBy === 'name') res = a.name.localeCompare(b.name);
            else if (sortBy === 'size') res = a.size - b.size;
            else res = a.createdAt.getTime() - b.createdAt.getTime();

            return sortDir === 'asc' ? res : -res;
        });

    if (!isElectron) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">Modo Desktop Necessário</h2>
                <p>O gerenciamento de documentos digitalizados está disponível apenas no aplicativo Desktop.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Galeria de Documentos</h1>
                    <p className="text-muted-foreground">
                        {documents.length} arquivos • {selectedPaths.size} selecionados
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={loadDocuments} variant="outline" size="icon">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    {selectedPaths.size > 0 && (
                        <>
                            <Button onClick={() => setLinkDialogOpen(true)} variant="secondary" className="gap-2 animate-in fade-in zoom-in-95">
                                <LinkIcon className="w-4 h-4" />
                                Vincular
                            </Button>
                            <Button onClick={() => setDeletePaths(Array.from(selectedPaths))} variant="destructive" className="gap-2 animate-in fade-in zoom-in-95">
                                <Trash2 className="w-4 h-4" />
                                Excluir ({selectedPaths.size})
                            </Button>
                        </>
                    )}

                    <Button onClick={() => setScannerOpen(true)} className="gap-2">
                        <Scan className="w-4 h-4" /> Nova Importação/Digitalização
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-lg items-end md:items-center">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-background"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="w-[140px] bg-background">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="size">Tamanho</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="bg-background"
                    >
                        {sortDir === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {filtered.length === 0 && !loading ? (
                <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((doc) => {
                        const isSelected = selectedPaths.has(doc.path);
                        const isLinked = doc.name.startsWith("[");

                        return (
                            <Card
                                key={doc.path}
                                className={`group transition-all cursor-pointer border-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted-foreground/20'}`}
                                onClick={() => toggleSelection(doc.path)}
                            >
                                <CardContent className="p-4 flex flex-col gap-3 relative">

                                    <div className="h-40 bg-muted/50 rounded-md flex items-center justify-center group-hover:bg-background transition-colors">
                                        {isLinked ? (
                                            <div className="text-center">
                                                <LinkIcon className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                                                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                    {doc.name.match(/^\[(.*?)\]/)?.[1] || "VINCULADO"}
                                                </span>
                                                <div className="mt-1 opacity-50 scale-75">
                                                    {getFileIcon(doc.name)}
                                                </div>
                                            </div>
                                        ) : (
                                            getFileIcon(doc.name)
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium truncate text-sm" title={doc.name}>
                                            {doc.name}
                                        </h4>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                            <span>{(doc.size / 1024).toFixed(0)} KB</span>
                                            <span>{format(doc.createdAt, "dd/MM/yyyy", { locale: ptBR })}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Button variant="ghost" size="sm" className="w-full gap-2 text-xs" onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpen(doc.path);
                                        }}>
                                            <Download className="w-3 h-3" /> Abrir
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <ScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScanComplete={() => {
                    setScannerOpen(false);
                    loadDocuments();
                }}
            />

            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vincular a Patrimônio</DialogTitle>
                        <DialogDescription>
                            Digite o código do patrimônio para vincular aos {selectedPaths.size} arquivos selecionados.
                            Isso adicionará o código ao nome do arquivo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Código do Patrimônio / Etiqueta</Label>
                        <Input
                            placeholder="Ex: 004392"
                            value={assetCode}
                            onChange={(e) => setAssetCode(e.target.value)}
                            className="mt-1.5"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => handleLinkToAsset('unlink')}>Desvincular</Button>
                        <Button onClick={() => handleLinkToAsset('link')}>Salvar Vínculo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={deletePaths.length > 0}
                onOpenChange={(open) => !open && setDeletePaths([])}
                title="Excluir Arquivos"
                description={`Tem certeza que deseja excluir ${deletePaths.length} arquivo(s)? Esta acao nao pode ser desfeita.`}
                onConfirm={() => handleDelete(deletePaths)}
                confirmText="Excluir"
                variant="destructive"
            />
        </div>
    );
}
