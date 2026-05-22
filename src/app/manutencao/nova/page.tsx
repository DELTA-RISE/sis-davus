"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { saveMaintenanceTask, getAssets } from "@/lib/db";
import { Asset, MaintenanceTask } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Upload, ArrowRight, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { useEffect } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/roles";

const steps = [
    { id: 1, title: "Identificação", description: "Selecione o patrimônio e prioridade" },
    { id: 2, title: "Diagnóstico", description: "Detalhamento do problema" },
    { id: 3, title: "Evidências", description: "Fotos e documentos" },
    { id: 4, title: "Revisão", description: "Confirmação dos dados" },
];

const maintenanceFormSchema = z.object({
    asset_id: z.string().min(1, "Selecione um patrimônio"),
    title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
    description: z.string().min(20, "Descrição detalhada é obrigatória (min 20 caracteres)"),
    priority: z.enum(["baixa", "media", "alta", "urgente"]),
    due_date: z.string().min(1, "Data prevista é obrigatória"),
    cost_estimate: z.number().min(0).optional(),
});

function NewMaintenanceContent() {
    const { user, userName, currentRole } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedAssetId = searchParams.get("assetId");

    const [currentStep, setCurrentStep] = useState(1);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [openAssetSelect, setOpenAssetSelect] = useState(false);
    const signerRoleLabel = getRoleLabel(currentRole);

    const form = useForm({
        resolver: zodResolver(maintenanceFormSchema),
        defaultValues: {
            asset_id: preSelectedAssetId || "",
            title: "",
            description: "",
            priority: "media" as "baixa" | "media" | "alta" | "urgente",
            due_date: "",
            cost_estimate: 0,
        },
    });

    useEffect(() => {
        getAssets().then(setAssets);
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = async (data: any) => {
        if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
            return;
        }

        setIsLoading(true);
        try {
            const selectedAsset = assets.find(a => a.id === data.asset_id);

            const task: Partial<MaintenanceTask> = {
                title: data.title,
                description: data.description,
                asset_id: data.asset_id,
                asset_name: selectedAsset?.name || "Desconhecido",
                asset_code: selectedAsset?.code,
                due_date: data.due_date,
                priority: data.priority,
                status: 'Aguardando Aprovação', // Workflow start
                cost: data.cost_estimate,
                created_by: user?.id,
                steps_data: [
                    {
                        id: '1', title: 'Diagnóstico Inicial', description: data.description, completed: true, completed_by: userName, completed_at: new Date().toISOString()
                    },
                    {
                        id: '2', title: 'Aprovação Gerencial', description: 'Aguardando análise do Administrador', completed: false
                    }
                ],
                approval_status: 'pending',
                manager_signature: `SIGNED_BY_${user?.id}_${Date.now()}`, // Simple mock signature
                manager_signed_at: new Date().toISOString(),
            };

            await saveMaintenanceTask(task, { name: userName, id: user?.id || "" });
            toast.success("Solicitação de manutenção criada com sucesso!");
            router.push("/patrimonio/manutencao");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar solicitação.");
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = async () => {
        const fieldsToValidate = [];
        if (currentStep === 1) fieldsToValidate.push("asset_id", "priority", "due_date");
        if (currentStep === 2) fieldsToValidate.push("title", "description");
        // Step 3 is optional (files)

        // @ts-expect-error - trigger accepts specific fields but typing might be loose
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Nova Solicitação de Manutenção</h1>
                <p className="text-muted-foreground">Preencha os dados abaixo para iniciar o fluxo de manutenção.</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
                {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
                            }`}>
                            {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                        </div>
                        <span className={`text-xs font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label>Patrimônio</Label>
                                    <Popover open={openAssetSelect} onOpenChange={setOpenAssetSelect}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openAssetSelect}
                                                className={cn("w-full justify-between", form.formState.errors.asset_id ? "border-destructive" : "")}
                                                disabled={!!preSelectedAssetId}
                                            >
                                                {form.watch("asset_id")
                                                    ? (() => {
                                                        const asset = assets.find((a) => a.id === form.watch("asset_id"));
                                                        return asset ? `${asset.code} - ${asset.name}` : "Selecione o item";
                                                    })()
                                                    : "Selecione o item"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar patrimônio..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum patrimônio encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {assets.map((asset) => (
                                                            <CommandItem
                                                                key={asset.id}
                                                                value={`${asset.code} ${asset.name}`}
                                                                onSelect={() => {
                                                                    form.setValue("asset_id", asset.id);
                                                                    setOpenAssetSelect(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        form.watch("asset_id") === asset.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {asset.code} - {asset.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {form.formState.errors.asset_id && <p className="text-sm text-destructive">{form.formState.errors.asset_id.message as string}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prioridade</Label>
                                        <Select
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onValueChange={(v: any) => form.setValue("priority", v)}
                                            value={form.watch("priority")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="baixa">Baixa</SelectItem>
                                                <SelectItem value="media">Média</SelectItem>
                                                <SelectItem value="alta">Alta</SelectItem>
                                                <SelectItem value="urgente">Urgente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Data Prevista</Label>
                                        <Input type="date" {...form.register("due_date")} />
                                        {form.formState.errors.due_date && <p className="text-sm text-destructive">{form.formState.errors.due_date.message as string}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label>Título do Problema</Label>
                                    <Input placeholder="Ex: Motor fazendo barulho estranho" {...form.register("title")} />
                                    {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição Detalhada</Label>
                                    <Textarea
                                        placeholder="Descreva o problema com o máximo de detalhes..."
                                        className="min-h-[150px]"
                                        {...form.register("description")}
                                    />
                                    {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message as string}</p>}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                                    <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                                    <p className="font-medium">Clique para fazer upload de fotos</p>
                                    <p className="text-sm text-muted-foreground">ou arraste e solte arquivos aqui</p>
                                    <Input id="file-upload" type="file" className="hidden" multiple onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))} />
                                </div>

                                {evidenceFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{evidenceFiles.length} arquivos selecionados:</p>
                                        <ul className="text-sm text-muted-foreground list-disc pl-4">
                                            {evidenceFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Estimativa de Custo (Opcional)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        {...form.register("cost_estimate", { valueAsNumber: true })}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                    <h3 className="font-semibold">Resumo da Solicitação</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-muted-foreground">Patrimônio:</span>
                                        <span>{assets.find(a => a.id === form.getValues("asset_id"))?.name}</span>

                                        <span className="text-muted-foreground">Prioridade:</span>
                                        <span>{form.getValues("priority")}</span>

                                        <span className="text-muted-foreground">Título:</span>
                                        <span>{form.getValues("title")}</span>

                                        <span className="text-muted-foreground">Arquivos:</span>
                                        <span>{evidenceFiles.length} anexos</span>
                                    </div>
                                    <div className="pt-2 border-t text-xs text-muted-foreground">
                                        Ao confirmar, você assinará digitalmente esta solicitação como {signerRoleLabel} Responsável.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar
                            </Button>

                            {currentStep < 4 ? (
                                <div className="space-x-2">
                                    <Link href={preSelectedAssetId ? `/patrimonio/detalhes?id=${preSelectedAssetId}` : "/patrimonio/manutencao"}>
                                        <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                            Cancelar
                                        </Button>
                                    </Link>
                                    <Button type="button" onClick={nextStep}>
                                        Próximo
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            ) : (
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Confirmar e Assinar
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewMaintenancePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <NewMaintenanceContent />
        </Suspense>
    );
}
