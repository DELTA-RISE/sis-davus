"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MaintenanceTask } from "@/lib/store";
import { getMaintenanceTasks, saveMaintenanceTask } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Pause,
  PlayCircle,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const statusConfig = {
  Pendente: { label: "Pendente", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Clock },
  "Em Andamento": { label: "Em andamento", color: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: PlayCircle },
  "Aguardando Aprovação": { label: "Aguardando aprovação", color: "bg-purple-500/20 text-purple-500 border-purple-500/30", icon: Clock },
  Aprovado: { label: "Aprovado", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30", icon: CheckCircle2 },
  Rejeitado: { label: "Rejeitado", color: "bg-red-500/20 text-red-500 border-red-500/30", icon: AlertTriangle },
  Atrasada: { label: "Atrasada", color: "bg-amber-500/20 text-amber-500 border-amber-500/30", icon: Pause },
  Concluída: { label: "Concluída", color: "bg-green-500/20 text-green-500 border-green-500/30", icon: CheckCircle2 },
};

const priorityConfig = {
  baixa: { label: "Baixa", color: "bg-slate-500/20 text-slate-400" },
  media: { label: "Média", color: "bg-blue-500/20 text-blue-500" },
  alta: { label: "Alta", color: "bg-orange-500/20 text-orange-500" },
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-500" },
};

type MaintenanceQuote = {
  company: string;
  value?: number;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getQuoteInfo = (task: MaintenanceTask) => {
  const quoteStep = task.steps_data?.find((step) => step.id === "quotes" || step.title?.toLowerCase().includes("cota"));
  const data = quoteStep?.data as { quotes?: MaintenanceQuote[]; lowest_quote?: MaintenanceQuote | null } | undefined;
  const quotes = data?.quotes || [];
  const lowestQuote =
    data?.lowest_quote ||
    quotes
      .filter((quote) => typeof quote.value === "number")
      .sort((a, b) => (a.value || 0) - (b.value || 0))[0] ||
    null;

  return { quotes, lowestQuote };
};

export default function ManutencaoKanbanPage() {
  const { userName, user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    const maintenanceTasks = await getMaintenanceTasks();
    setTasks(maintenanceTasks);
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("maintenance")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { event: "*", table: "maintenance_tasks" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleUpdateStatus = async (task: MaintenanceTask, newStatus: MaintenanceTask["status"]) => {
    const updated = await saveMaintenanceTask(
      { ...task, status: newStatus, updated_at: new Date().toISOString() },
      { name: userName, id: user?.id || "" }
    );
    if (!updated) toast.error("Erro ao atualizar status");
  };

  const columns: { status: MaintenanceTask["status"]; tasks: MaintenanceTask[] }[] = [
    { status: "Pendente", tasks: tasks.filter((task) => task.status === "Pendente") },
    { status: "Em Andamento", tasks: tasks.filter((task) => task.status === "Em Andamento") },
    { status: "Aguardando Aprovação", tasks: tasks.filter((task) => task.status === "Aguardando Aprovação") },
    { status: "Aprovado", tasks: tasks.filter((task) => task.status === "Aprovado") },
    { status: "Rejeitado", tasks: tasks.filter((task) => task.status === "Rejeitado") },
    { status: "Atrasada", tasks: tasks.filter((task) => task.status === "Atrasada") },
    { status: "Concluída", tasks: tasks.filter((task) => task.status === "Concluída") },
  ];

  const filteredTasks = statusFilter === "all" ? tasks : tasks.filter(task => task.status === statusFilter);

  const TaskCard = ({ task, showStatus = false }: { task: MaintenanceTask; showStatus?: boolean }) => {
    const priorityCfg = priorityConfig[task.priority] || { label: task.priority, color: "bg-slate-500/20 text-slate-400" };
    const statusCfg = statusConfig[task.status] || { label: task.status, color: "bg-slate-500/20 text-slate-400" };
    const { lowestQuote } = getQuoteInfo(task);

    return (
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <Link href={`/patrimonio/detalhes?id=${task.asset_id}`} className="group">
            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{task.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{task.asset_code} - {task.asset_name}</p>
          </Link>

          <div className="flex flex-wrap gap-1 mt-2">
            <Badge className={`text-[8px] h-4 px-1 ${priorityCfg.color}`}>{priorityCfg.label}</Badge>
            {showStatus && <Badge className={`text-[8px] h-4 px-1 ${statusCfg.color}`}>{statusCfg.label}</Badge>}
          </div>

          {task.description && (
            <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {lowestQuote && (
            <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-500">
              <span className="font-medium">Menor cotação:</span>{" "}
              {lowestQuote.company} - {formatCurrency(lowestQuote.value || 0)}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              Retorno: {task.due_date ? new Date(task.due_date).toLocaleDateString("pt-BR") : "S/P"}
            </span>
            <span className="flex items-center gap-1 truncate">
              <User className="h-2.5 w-2.5 shrink-0" />
              {task.assigned_to || "Sem responsável"}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Andamento
              </span>
              <Badge className={`h-5 px-2 text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
            </div>
            <Select
              value={task.status}
              onValueChange={(value) => handleUpdateStatus(task, value as MaintenanceTask["status"])}
            >
              <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/70 text-xs font-semibold text-foreground">
                <SelectValue placeholder="Atualizar status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([status, cfg]) => (
                  <SelectItem key={status} value={status}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === "kanban" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 bg-background">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] mb-4 bg-card/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([key, value]) => <SelectItem key={key} value={key}>{value.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {viewMode === "list" || (typeof window !== "undefined" && window.innerWidth < 768) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map(task => <TaskCard key={task.id} task={task} showStatus={statusFilter === "all"} />)}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(column => (
              <div key={column.status} className="w-80 shrink-0 bg-muted/30 rounded-xl p-2 border-2 border-transparent">
                <div className="flex items-center justify-between p-2 mb-2">
                  <span className="text-xs font-semibold uppercase">{statusConfig[column.status].label}</span>
                  <Badge variant="secondary" className="text-[10px]">{column.tasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {column.tasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
