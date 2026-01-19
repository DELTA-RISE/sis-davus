"use client";

import { useEffect, useState, Suspense } from "react";
import { MaintenanceTask } from "@/lib/store";
import { getMaintenanceTasks } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";

function CertificateContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [task, setTask] = useState<MaintenanceTask | null>(null);

    useEffect(() => {
        if (id) {
            getMaintenanceTasks().then(tasks => {
                const found = tasks.find(t => t.id === id);
                setTask(found || null);
            });
        }
    }, [id]);

    if (!task) return <div className="p-8 text-center text-muted-foreground">Carregando certificado...</div>;

    return (
        <div className="min-h-screen bg-white text-black p-8 print:p-0">
            <div className="max-w-3xl mx-auto border-4 border-double border-slate-800 p-12 relative bg-white shadow-2xl print:shadow-none print:border-none">

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                    <div className="text-[15rem] font-black -rotate-45 whitespace-nowrap">CERTIFICADO</div>
                </div>

                <div className="relative z-10 text-center space-y-8">
                    <div className="border-b-2 border-slate-800 pb-6">
                        <h1 className="text-4xl font-serif font-bold tracking-wider mb-2">CERTIFICADO DE MANUTENÇÃO</h1>
                        <p className="text-sm font-semibold tracking-[0.3em] uppercase text-slate-600">Sistema de Gestão de Patrimônio SIS-DAVUS</p>
                    </div>

                    <div className="text-left font-serif leading-relaxed text-lg space-y-6 px-8">
                        <p>
                            Certifica-se para os devidos fins que o patrimônio descrito abaixo foi submetido a processo de manutenção, tendo cumprido todas as etapas de verificação e aprovação técnica exigidas.
                        </p>

                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-sm space-y-3 font-sans text-base">
                            <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-500 text-xs uppercase tracking-widest">Patrimônio</span>
                                <span className="col-span-2 font-medium">{task.asset_name} ({task.asset_code})</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-500 text-xs uppercase tracking-widest">Protocolo</span>
                                <span className="col-span-2 font-mono text-sm">{task.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-500 text-xs uppercase tracking-widest">Serviço</span>
                                <span className="col-span-2">{task.title}</span>
                            </div>
                            <div className="grid grid-cols-3 pb-2">
                                <span className="font-bold text-slate-500 text-xs uppercase tracking-widest">Data Aprovação</span>
                                <span className="col-span-2">{new Date(task.admin_signed_at || "").toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>

                        <div className="pt-8 grid grid-cols-2 gap-16 text-center text-sm font-sans mt-12">
                            <div className="space-y-2">
                                <div className="border-b border-slate-400 pb-1 font-signature text-2xl text-slate-600">
                                    {task.created_by}
                                </div>
                                <p className="font-bold uppercase text-xs tracking-wider text-slate-400">Assinatura do Gestor</p>
                                <p className="text-xs text-slate-400 font-mono">{task.manager_signature?.slice(0, 20)}...</p>
                            </div>
                            <div className="space-y-2">
                                <div className="border-b border-slate-400 pb-1 font-signature text-2xl text-slate-600">
                                    {task.approved_by}
                                </div>
                                <p className="font-bold uppercase text-xs tracking-wider text-slate-400">Assinatura do Administrador</p>
                                <p className="text-xs text-slate-400 font-mono">{task.admin_signature?.slice(0, 20)}...</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t-2 border-slate-800 pt-6 mt-12 flex justify-between items-end text-xs text-slate-400 font-mono">
                        <div>
                            HASH: {task.admin_signature}<br />
                            EMITIDO EM: {new Date().toLocaleString()}
                        </div>
                        <div className="text-right">
                            Documento assinado digitalmente.<br />
                            Validade condicionada à verificação no sistema.
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 right-8 print:hidden">
                <Button onClick={() => window.print()} className="shadow-xl">
                    <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
                </Button>
            </div>

            <style jsx global>{`
         @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&display=swap');
         .font-serif { font-family: 'Playfair Display', serif; }
         .font-signature { font-family: 'Dancing Script', cursive; }
       `}</style>
        </div>
    );
}

export default function CertificateClient() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
            <CertificateContent />
        </Suspense>
    );
}
