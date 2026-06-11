"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronsUpDown,
    Loader2,
    Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useAuth } from "@/lib/auth-context";
import { saveMaintenanceTask, getAssets, getUsers } from "@/lib/db";
import { Asset, MaintenanceTask, User } from "@/lib/store";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/roles";
import { getScopedCostCenter } from "@/lib/access-scope";
import { findMaintenanceResponsible } from "@/lib/maintenance-responsibility";

const steps = [
    { id: 1, title: "Identificação", description: "Selecione o patrimônio e prioridade" },
    { id: 2, title: "Diagnóstico", description: "Defeito e detalhamento" },
    { id: 3, title: "Cotação", description: "Menor preço encontrado" },
    { id: 4, title: "Revisão", description: "Confirmação dos dados" },
];

const maintenanceFormSchema = z.object({
    asset_id: z.string().min(1, "Selecione um patrimônio"),
    title: z.string().min(5, "Informe o defeito com pelo menos 5 caracteres"),
    description: z.string().min(20, "Detalhamento é obrigatório (min 20 caracteres)"),
    priority: z.enum(["baixa", "media", "alta", "urgente"]),
    due_date: z.string().min(1, "Data prevista para retorno é obrigatória"),
    quote_company_1: z.string().optional(),
    quote_value_1: z.string().optional(),
    quote_company_2: z.string().optional(),
    quote_value_2: z.string().optional(),
    quote_company_3: z.string().optional(),
    quote_value_3: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

type MaintenanceQuote = {
    company: string;
    value?: number;
};

const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseQuoteValue = (value?: string) => {
    const normalized = String(value || "").trim().replace(/\./g, "").replace(",", ".");
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const buildQuotes = (data: MaintenanceFormData): MaintenanceQuote[] => {
    return [1, 2, 3].reduce<MaintenanceQuote[]>((quotes, index) => {
            const company = String(data[`quote_company_${index}` as keyof MaintenanceFormData] || "").trim();
            const value = parseQuoteValue(String(data[`quote_value_${index}` as keyof MaintenanceFormData] || ""));
            if (company || value !== undefined) {
                quotes.push({ company: company || `Empresa ${index}`, value });
            }
            return quotes;
        }, []);
};

const getLowestQuote = (quotes: MaintenanceQuote[]) =>
    quotes
        .filter((quote) => typeof quote.value === "number")
        .sort((a, b) => (a.value || 0) - (b.value || 0))[0];

function NewMaintenanceContent() {
    const { user, userName, currentRole, costCenter } = useAuth();
    const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedAssetId = searchParams.get("assetId");

    const [currentStep, setCurrentStep] = useState(1);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [openAssetSelect, setOpenAssetSelect] = useState(false);
    const signerRoleLabel = getRoleLabel(currentRole);

    const form = useForm<MaintenanceFormData>({
        resolver: zodResolver(maintenanceFormSchema),
        defaultValues: {
            asset_id: preSelectedAssetId || "",
            title: "",
            description: "",
            priority: "media",
            due_date: "",
            quote_company_1: "",
            quote_value_1: "",
            quote_company_2: "",
            quote_value_2: "",
            quote_company_3: "",
            quote_value_3: "",
        },
    });

    const watchedQuotes = form.watch([
        "quote_company_1",
        "quote_value_1",
        "quote_company_2",
        "quote_value_2",
        "quote_company_3",
        "quote_value_3",
    ]);

    const quotePreview = useMemo(() => {
        return buildQuotes({
            ...form.getValues(),
            quote_company_1: watchedQuotes[0],
            quote_value_1: watchedQuotes[1],
            quote_company_2: watchedQuotes[2],
            quote_value_2: watchedQuotes[3],
            quote_company_3: watchedQuotes[4],
            quote_value_3: watchedQuotes[5],
        });
    }, [form, watchedQuotes]);

    const lowestQuotePreview = getLowestQuote(quotePreview);
    const maintenanceResponsible = useMemo(() => findMaintenanceResponsible(users), [users]);

    useEffect(() => {
        Promise.all([
            getAssets(false, scopedCostCenter),
            getUsers(false),
        ]).then(([assetList, userList]) => {
            setAssets(assetList);
            setUsers(userList);
        });
    }, [scopedCostCenter]);

    const onSubmit = async (data: MaintenanceFormData) => {
        if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
            return;
        }

        setIsLoading(true);
        try {
            const selectedAsset = assets.find(a => a.id === data.asset_id);
            if (!maintenanceResponsible) {
                toast.error("Defina o responsável pela manutenção/matriz em Gestão de Usuários antes de solicitar manutenção.");
                setIsLoading(false);
                return;
            }

            const quotes = buildQuotes(data);
            const lowestQuote = getLowestQuote(quotes);
            const quoteDescription = lowestQuote
                ? `Menor cotação: ${lowestQuote.company} - ${formatCurrency(lowestQuote.value || 0)}`
                : "Nenhuma cotação informada.";

            const task: Partial<MaintenanceTask> = {
                title: data.title,
                description: data.description,
                asset_id: data.asset_id,
                asset_name: selectedAsset?.name || "Desconhecido",
                asset_code: selectedAsset?.code,
                due_date: data.due_date,
                priority: data.priority,
                status: "Aguardando Aprovação",
                cost: lowestQuote?.value ?? 0,
                created_by: user?.id,
                assigned_to: maintenanceResponsible.id,
                steps_data: [
                    {
                        id: "1",
                        title: "Diagnóstico inicial",
                        description: `Defeito: ${data.title}\nDetalhamento: ${data.description}`,
                        completed: true,
                        completed_by: userName,
                        completed_at: new Date().toISOString(),
                        data: {
                            defect: data.title,
                            details: data.description,
                        },
                    },
                    {
                        id: "quotes",
                        title: "Cotação (menor preço)",
                        description: quoteDescription,
                        completed: quotes.length > 0,
                        completed_by: quotes.length > 0 ? userName : undefined,
                        completed_at: quotes.length > 0 ? new Date().toISOString() : undefined,
                        data: {
                            quotes,
                            lowest_quote: lowestQuote || null,
                            evidence_files: evidenceFiles.map((file) => file.name),
                        },
                    },
                    {
                        id: "2",
                        title: "Aprovação da manutenção",
                        description: `Aguardando análise de ${maintenanceResponsible.name}`,
                        completed: false,
                    },
                ],
                approval_status: "pending",
                manager_signature: `SIGNED_BY_${user?.id}_${Date.now()}`,
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
        const fieldsToValidate: (keyof MaintenanceFormData)[] = [];
        if (currentStep === 1) fieldsToValidate.push("asset_id", "priority", "due_date");
        if (currentStep === 2) fieldsToValidate.push("title", "description");

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

            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
                {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"}`}>
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
                                    {form.formState.errors.asset_id && <p className="text-sm text-destructive">{form.formState.errors.asset_id.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prioridade</Label>
                                        <Select onValueChange={(value: MaintenanceFormData["priority"]) => form.setValue("priority", value)} value={form.watch("priority")}>
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
                                        <Label>Data prevista para retorno</Label>
                                        <Input type="date" {...form.register("due_date")} />
                                        {form.formState.errors.due_date && <p className="text-sm text-destructive">{form.formState.errors.due_date.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label>Defeito</Label>
                                    <Input placeholder="Ex: Motor fazendo barulho estranho" {...form.register("title")} />
                                    {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Detalhamento</Label>
                                    <Textarea
                                        placeholder="Descreva o defeito, sintomas, condições de uso e qualquer informação relevante..."
                                        className="min-h-[150px]"
                                        {...form.register("description")}
                                    />
                                    {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="rounded-xl border border-border/70 bg-background/40 p-4 space-y-4">
                                    <div>
                                        <Label>Cotação (menor preço)</Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Informe até três empresas. Não é obrigatório preencher todas.
                                        </p>
                                    </div>

                                    {[1, 2, 3].map((index) => (
                                        <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                                            <Input
                                                placeholder={`Empresa ${index}`}
                                                {...form.register(`quote_company_${index}` as keyof MaintenanceFormData)}
                                            />
                                            <Input
                                                inputMode="decimal"
                                                placeholder="Valor em R$"
                                                {...form.register(`quote_value_${index}` as keyof MaintenanceFormData)}
                                            />
                                        </div>
                                    ))}

                                    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                                        {lowestQuotePreview
                                            ? (
                                                <span>
                                                    Menor preço: <strong>{lowestQuotePreview.company}</strong> - {formatCurrency(lowestQuotePreview.value || 0)}
                                                </span>
                                            )
                                            : <span className="text-muted-foreground">A menor cotação aparecerá aqui quando algum valor for informado.</span>}
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>
                                    <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                                    <p className="font-medium">Clique para anexar evidências</p>
                                    <p className="text-sm text-muted-foreground">Fotos, documentos ou arquivos de apoio</p>
                                    <Input id="file-upload" type="file" className="hidden" multiple onChange={(event) => setEvidenceFiles(Array.from(event.target.files || []))} />
                                </div>

                                {evidenceFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{evidenceFiles.length} arquivos selecionados:</p>
                                        <ul className="text-sm text-muted-foreground list-disc pl-4">
                                            {evidenceFiles.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                                    <h3 className="font-semibold">Resumo da Solicitação</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        <span className="text-muted-foreground">Patrimônio:</span>
                                        <span>{assets.find(a => a.id === form.getValues("asset_id"))?.name}</span>

                                        <span className="text-muted-foreground">Retorno previsto:</span>
                                        <span>{form.getValues("due_date") ? new Date(form.getValues("due_date")).toLocaleDateString("pt-BR") : "Não informado"}</span>

                                        <span className="text-muted-foreground">Prioridade:</span>
                                        <span>{form.getValues("priority")}</span>

                                        <span className="text-muted-foreground">Defeito:</span>
                                        <span>{form.getValues("title")}</span>

                                        <span className="text-muted-foreground">Menor cotação:</span>
                                        <span>{lowestQuotePreview ? `${lowestQuotePreview.company} - ${formatCurrency(lowestQuotePreview.value || 0)}` : "Não informada"}</span>

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
