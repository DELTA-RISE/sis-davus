"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MaintenanceTask, Asset } from "@/lib/store";
import { getMaintenanceTasks, saveMaintenanceTask, getAssets } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  Plus,
  ArrowLeft,
  Clock,
  PlayCircle,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  GripVertical,
  LayoutGrid,
  List,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const statusConfig = {
  Pendente: { label: "Pendente", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Clock, columnColor: "border-slate-500/50" },
  'Em Andamento': { label: "Em Andamento", color: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: PlayCircle, columnColor: "border-blue-500/50" },
  Atrasada: { label: "Atrasada", color: "bg-amber-500/20 text-amber-500 border-amber-500/30", icon: Pause, columnColor: "border-amber-500/50" },
  'Concluída': { label: "Concluído", color: "bg-green-500/20 text-green-500 border-green-500/30", icon: CheckCircle2, columnColor: "border-green-500/50" },
};

const priorityConfig = {
  Baixa: { label: "Baixa", color: "bg-slate-500/20 text-slate-400" },
  Média: { label: "Média", color: "bg-blue-500/20 text-blue-500" },
  Alta: { label: "Alta", color: "bg-orange-500/20 text-orange-500" },
  Urgente: { label: "Urgente", color: "bg-red-500/20 text-red-500" },
};

export default function ManutencaoKanbanPage() {
  const { userName, user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<MaintenanceTask>>({ status: "Pendente", priority: "Média" });
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [t, a] = await Promise.all([getMaintenanceTasks(), getAssets()]);
    setTasks(t);
    setAssets(a);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('maintenance').on('postgres_changes' as any, { event: '*', table: 'maintenance_tasks' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleCreateTask = async () => {
    if (!newTask.asset_id || !newTask.title) return;
    const asset = assets.find(a => a.id === newTask.asset_id);
    if (!asset) return;

    const payload: Partial<MaintenanceTask> = {
      ...newTask,
      asset_name: asset.name,
      asset_code: asset.code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await saveMaintenanceTask(payload, { name: userName, id: user?.id || "" });
    if (saved) {
      toast.success("Manutenção agendada!");
      setIsDialogOpen(false);
      setNewTask({ status: "Pendente", priority: "Média" });
    }
  };

  const handleUpdateStatus = async (task: MaintenanceTask, newStatus: MaintenanceTask["status"]) => {
    const updated = await saveMaintenanceTask({ ...task, status: newStatus, updated_at: new Date().toISOString() }, { name: userName, id: user?.id || "" });
    if (!updated) toast.error("Erro ao atualizar status");
  };

  const columns: { status: MaintenanceTask["status"]; tasks: MaintenanceTask[] }[] = [
    { status: "Pendente", tasks: tasks.filter((t) => t.status === "Pendente") },
    { status: "Em Andamento", tasks: tasks.filter((t) => t.status === "Em Andamento") },
    { status: "Atrasada", tasks: tasks.filter((t) => t.status === "Atrasada") },
    { status: "Concluída", tasks: tasks.filter((t) => t.status === "Concluída") },
  ];

  const filteredTasks = statusFilter === "all" ? tasks : tasks.filter(t => t.status === statusFilter);

  const TaskCard = ({ task, showStatus = false }: { task: MaintenanceTask; showStatus?: boolean }) => {
    const priorityCfg = priorityConfig[task.priority];
    const statusCfg = statusConfig[task.status];
    return (
      <Card className="border-border/50 bg-card">
        <CardContent className="p-3">
          <Link href={`/patrimonio/detalhes?id=${task.asset_id}`} className="group">
            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{task.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{task.asset_code} - {task.asset_name}</p>
          </Link>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge className={`text-[8px] h-4 px-1 ${priorityCfg.color}`}>{priorityCfg.label}</Badge>
            {showStatus && <Badge className={`text-[8px] h-4 px-1 ${statusCfg.color}`}>{statusCfg.label}</Badge>}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'S/P'}</span>
            <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{task.assigned_to || 'Unassigned'}</span>
          </div>
          <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
            {Object.entries(statusConfig).map(([s, cfg]) => (
              s !== task.status && (
                <Button key={s} variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleUpdateStatus(task, s as any)}>
                  <cfg.icon className="h-3 w-3" />
                </Button>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/patrimonio"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"><Wrench className="h-5 w-5 text-purple-500" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Manutenções</h1>
                <Badge variant="outline" className="h-5 px-1.5 gap-1 bg-primary/5"><Zap className="h-2 w-2 text-primary animate-pulse" /> Realtime</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{tasks.length} tarefas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex border border-border rounded-lg p-1">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4" /></Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="h-9 gap-1"><Plus className="h-4 w-4" />Nova</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                <DialogHeader><DialogTitle>Agendar Manutenção</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Patrimônio</Label>
                    <Select value={newTask.asset_id} onValueChange={v => setNewTask({ ...newTask, asset_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={newTask.title || ""} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo</Label>
                      <Input type="date" value={newTask.due_date || ""} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={handleCreateTask} className="w-full">Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-4 bg-background">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] mb-4 bg-card/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {viewMode === 'list' || typeof window !== 'undefined' && window.innerWidth < 768 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map(t => <TaskCard key={t.id} task={t} showStatus={statusFilter === 'all'} />)}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(col => (
              <div key={col.status} className="w-80 shrink-0 bg-muted/30 rounded-xl p-2 border-2 border-transparent">
                <div className="flex items-center justify-between p-2 mb-2">
                  <span className="text-xs font-semibold uppercase">{statusConfig[col.status].label}</span>
                  <Badge variant="secondary" className="text-[10px]">{col.tasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {col.tasks.map(t => <TaskCard key={t.id} task={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
