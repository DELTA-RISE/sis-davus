"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MaintenanceTask } from "@/lib/store";
import { getMaintenanceTasks, saveMaintenanceTask } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from "lucide-react";

export default function AdminMaintenancePage() {
    const { user, userName } = useAuth();
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    useEffect(() => {
        loadTasks();
    }, [user]);

    const loadTasks = async () => {
        setIsLoading(true);
        const data = await getMaintenanceTasks();
        setTasks(data);
        setIsLoading(false);
    };

    const pendingTasks = tasks.filter(t => t.approval_status === 'pending');
    const approvedTasks = tasks.filter(t => t.approval_status === 'approved');
    const rejectedTasks = tasks.filter(t => t.approval_status === 'rejected');

    const handleApprove = async (task: MaintenanceTask) => {
        try {
            const updatedTask: Partial<MaintenanceTask> = {
                ...task,
                approval_status: 'approved',
                status: 'Aprovado', // Updates main status
                approved_by: user?.id,
                admin_signature: `APPROVED_${user?.id}_${Date.now()}`,
                admin_signed_at: new Date().toISOString(),
                steps_data: task.steps_data?.map(step =>
                    step.id === '2' ? { ...step, completed: true, completed_by: userName, completed_at: new Date().toISOString() } : step
                )
            };

            await saveMaintenanceTask(updatedTask, { name: userName, id: user?.id || "" });
            toast.success("Solicitação aprovada com sucesso!");
            loadTasks();
        } catch {
            toast.error("Erro ao aprovar solicitação.");
        }
    };

    const handleReject = async () => {
        if (!selectedTask || !rejectionReason) return;

        try {
            const updatedTask: Partial<MaintenanceTask> = {
                ...selectedTask,
                approval_status: 'rejected',
                status: 'Rejeitado',
                rejection_reason: rejectionReason,
                steps_data: selectedTask.steps_data?.map(step =>
                    step.id === '2' ? { ...step, completed: false, description: `Rejeitado: ${rejectionReason}` } : step
                )
            };

            await saveMaintenanceTask(updatedTask, { name: userName, id: user?.id || "" });
            toast.success("Solicitação rejeitada.");
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedTask(null);
            loadTasks();
        } catch {
            toast.error("Erro ao rejeitar solicitação.");
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Clock className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="container max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento de Manutenção</h1>
                    <p className="text-muted-foreground">Aprove ou rejeite solicitações de manutenção.</p>
                </div>
            </div>

            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="pending" className="relative">
                        Pendentes
                        {pendingTasks.length > 0 && <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">{pendingTasks.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="approved">Aprovados</TabsTrigger>
                    <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pendingTasks.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação pendente.</div>}
                    {pendingTasks.map(task => (
                        <MaintenanceCard
                            key={task.id}
                            task={task}
                            onApprove={() => handleApprove(task)}
                            onReject={() => { setSelectedTask(task); setIsRejectDialogOpen(true); }}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                    {approvedTasks.map(task => (
                        <MaintenanceCard key={task.id} task={task} readOnly />
                    ))}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                    {rejectedTasks.map(task => (
                        <MaintenanceCard key={task.id} task={task} readOnly />
                    ))}
                </TabsContent>
            </Tabs>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Solicitação</DialogTitle>
                        <DialogDescription>Por favor, informe o motivo da rejeição para o gestor.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Motivo</Label>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Ex: Falta evidências, Custo muito alto..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirmar Rejeição</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function MaintenanceCard({ task, onApprove, onReject, readOnly }: { task: MaintenanceTask, onApprove?: () => void, onReject?: () => void, readOnly?: boolean }) {
    return (
        <Card key={task.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {task.asset_name}
                            <Badge variant="outline" className="text-xs font-normal">{task.asset_code}</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">Solicitado por: {task.created_by} em {new Date(task.created_at || "").toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={task.priority === 'alta' ? 'destructive' : 'secondary'}>{task.priority}</Badge>
                        {task.cost ? <span className="text-sm font-medium text-green-600">R$ {task.cost}</span> : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-1">Problema Relatado</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">{task.description}</p>
                </div>

                {task.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <span className="font-semibold block">Motivo da Rejeição:</span>
                            {task.rejection_reason}
                        </div>
                    </div>
                )}
            </CardContent>
            {!readOnly && (
                <CardFooter className="bg-muted/30 p-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onReject} className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10">
                        <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                    <Button size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                </CardFooter>
            )}
            {readOnly && task.approval_status === 'approved' && (
                <CardFooter className="bg-muted/30 p-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/manutencao/certificado?id=${task.id}`} target="_blank">
                            <FileText className="w-4 h-4 mr-1" /> Ver Certificado
                        </a>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
