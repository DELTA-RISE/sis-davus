"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Laptop, File, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useElectron } from "@/hooks/use-electron";
import { getAssets, getProducts } from "@/lib/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FileDropWizardProps {
    file: { name: string; path: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

type WizardStep = 'type-selection' | 'code-entry' | 'processing' | 'success';
type FileCategory = 'asset' | 'input' | 'other';

export function FileDropWizard({ file, isOpen, onClose }: FileDropWizardProps) {
    const { importDocument } = useElectron();
    const router = useRouter();

    const [step, setStep] = useState<WizardStep>('type-selection');
    const [category, setCategory] = useState<FileCategory | null>(null);
    const [code, setCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [foundName, setFoundName] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('type-selection');
            setCategory(null);
            setCode("");
            setError(null);
            setFoundName(null);
        }
    }, [isOpen, file]);

    const handleCategorySelect = (cat: FileCategory) => {
        setCategory(cat);
        if (cat === 'other') {
            handleImport(cat);
        } else {
            setStep('code-entry');
        }
    };

    const validateCode = async () => {
        setIsValidating(true);
        setError(null);
        setFoundName(null);

        try {
            if (category === 'asset') {
                const assets = await getAssets(false); // check cache first
                // Flexible check: Exact code OR part of name
                const match = assets.find(a => a.code === code || a.name.toLowerCase().includes(code.toLowerCase()));

                if (match) {
                    setFoundName(`${match.code} - ${match.name}`);
                    return match.code; // Return formalized code
                } else {
                    setError("Patrimônio não encontrado.");
                    return null;
                }
            } else if (category === 'input') {
                const products = await getProducts(false);
                const match = products.find(p => p.sku === code || p.name.toLowerCase().includes(code.toLowerCase()));

                if (match) {
                    setFoundName(`${match.sku} - ${match.name}`);
                    return match.sku;
                } else {
                    setError("Produto/Insumo não encontrado.");
                    return null;
                }
            }
        } catch (e) {
            console.error(e);
            setError("Erro ao validar.");
        } finally {
            setIsValidating(false);
        }
        return null;
    };

    const handleConfirmValidation = async () => {
        if (!foundName) {
            // Try to validate if user just hit enter
            const validCode = await validateCode();
            if (validCode) {
                // If found, proceed immediately or wait for confirmation?
                // Let's proceed to import with the found code
                handleImport(category!, validCode);
            }
        } else {
            // Extract code from foundName or use current input if it was exact?
            // Actually validateCode returns the code. Let's start import.
            // We need the code used for renaming.
            // Let's assume the first part of foundName is code
            const finalCode = foundName.split(' - ')[0];
            handleImport(category!, finalCode);
        }
    };

    const handleImport = async (cat: FileCategory, validCode?: string) => {
        if (!file) return;

        setStep('processing');
        try {
            let customName = file.name;

            if (cat === 'asset' && validCode) {
                customName = `[${validCode}] ${file.name}`;
            } else if (cat === 'input' && validCode) {
                customName = `[SKU-${validCode}] ${file.name}`; // Distinct prefix for products
            }

            const res = await importDocument(file.path, customName);

            if (res.success) {
                setStep('success');
                toast.success("Arquivo importado com sucesso!");
                setTimeout(() => {
                    onClose();
                    // Optional: Navigate to gallery? User might be doing multiple drops.
                    // Let's just stay where we are, showing success.
                    // router.push('/documentos'); 
                }, 1500);
            } else {
                setError(res.error || "Erro na importação");
                setStep('code-entry'); // Go back
            }
        } catch (e) {
            setError("Falha crítica na importação");
            setStep('code-entry');
        }
    };

    const handleClose = () => {
        if (step === 'processing') return;
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Importar Arquivo</DialogTitle>
                    <DialogDescription>
                        {file?.name}
                    </DialogDescription>
                </DialogHeader>

                {step === 'type-selection' && (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5" onClick={() => handleCategorySelect('asset')}>
                            <Laptop className="w-8 h-8 text-blue-500" />
                            <span>Patrimônio</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5" onClick={() => handleCategorySelect('input')}>
                            <Package className="w-8 h-8 text-amber-500" />
                            <span>Insumo / Estoque</span>
                        </Button>
                        <Button variant="ghost" className="col-span-2" onClick={() => handleCategorySelect('other')}>
                            <File className="w-4 h-4 mr-2" />
                            Apenas salvar na Galeria
                        </Button>
                    </div>
                )}

                {step === 'code-entry' && (
                    <div className="space-y-4 py-4">
                        <Label>
                            {category === 'asset' ? 'Código do Patrimônio ou Nome' : 'SKU ou Nome do Produto'}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setError(null);
                                    setFoundName(null);
                                }}
                                placeholder={category === 'asset' ? "Ex: 004932" : "Ex: PAP001"}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmValidation()}
                                autoFocus
                            />
                            <Button onClick={handleConfirmValidation} disabled={!code || isValidating}>
                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                            </Button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {foundName && (
                            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-2 rounded border border-green-200">
                                <CheckCircle className="w-4 h-4" />
                                <span>Encontrado: <strong>{foundName}</strong></span>
                            </div>
                        )}
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground">Processando e salvando arquivo...</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <p className="font-medium">Arquivo salvo com sucesso!</p>
                    </div>
                )}

                <DialogFooter className={step === 'type-selection' || step === 'success' || step === 'processing' ? 'hidden' : ''}>
                    <Button variant="ghost" onClick={() => setStep('type-selection')}>Voltar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
