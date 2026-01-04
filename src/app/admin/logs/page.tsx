"use client";


import { useState, useEffect } from "react";
import { getAuditLogs } from "@/lib/db";
import { AuditLog } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  User,
  Clock,
  Monitor,
  Filter,
  Plus,
  Edit,
  Trash,
  LogIn,
  Download,
  ArrowLeftRight,
} from "lucide-react";

const actionIcons: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash,
  LOGIN: LogIn,
  EXPORT: Download,
  CHECKOUT: ArrowLeftRight,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/20 text-green-500",
  UPDATE: "bg-blue-500/20 text-blue-500",
  DELETE: "bg-red-500/20 text-red-500",
  LOGIN: "bg-purple-500/20 text-purple-500",
  EXPORT: "bg-amber-500/20 text-amber-500",
  CHECKOUT: "bg-cyan-500/20 text-cyan-500",
};

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getAuditLogs();
      setLogs(data);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Logs de Auditoria</h1>
              <p className="text-xs text-muted-foreground">{filteredLogs.length} registros</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card/50 border-border/50 h-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[120px] md:w-[150px] bg-card/50 border-border/50 h-10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CREATE">Criar</SelectItem>
              <SelectItem value="UPDATE">Editar</SelectItem>
              <SelectItem value="DELETE">Excluir</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="EXPORT">Export</SelectItem>
              <SelectItem value="CHECKOUT">Checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {filteredLogs.map((log) => {
            const Icon = actionIcons[log.action] || Edit;
            const colorClass = actionColors[log.action] || "bg-gray-500/20 text-gray-500";

            return (
              <Card
                key={log.id}
                className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                onClick={() => handleLogClick(log)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {log.entity}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{log.details}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.timestamp)}
                        </span>
                        <span className="flex items-center gap-1 hidden md:flex">
                          <Monitor className="h-3 w-3" />
                          {log.ip}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md border-border">
            <DialogHeader>
              <DialogTitle>Detalhes do Log</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border/50">
                  <div className={`w-10 h-10 rounded-lg ${actionColors[selectedLog.action]} flex items-center justify-center`}>
                    {(() => {
                      const Icon = actionIcons[selectedLog.action] || Edit;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedLog.action}</h3>
                    <p className="text-xs text-muted-foreground">{selectedLog.entity} • ID: {selectedLog.entity_id}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium">{selectedLog.details}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Usuário:</span>
                    <span className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" /> {selectedLog.user_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(selectedLog.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Monitor className="h-3 w-3" /> {selectedLog.ip || "Não registrado"}
                    </span>
                  </div>
                  <div className="border-t border-border/50 my-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Informações do Dispositivo</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-secondary/50 p-2 rounded">
                        <span className="text-muted-foreground block">Sistema Operacional</span>
                        <span className="font-medium">{selectedLog.device_info?.os || "Desconhecido"}</span>
                      </div>
                      <div className="bg-secondary/50 p-2 rounded">
                        <span className="text-muted-foreground block">Navegador</span>
                        <span className="font-medium">{selectedLog.device_info?.browser || "Desconhecido"}</span>
                      </div>
                      <div className="bg-secondary/50 p-2 rounded col-span-2">
                        <span className="text-muted-foreground block">Dispositivo</span>
                        <span className="font-medium">{selectedLog.device_info?.device || "Desconhecido/Desktop"}</span>
                      </div>
                      <div className="bg-secondary/50 p-2 rounded col-span-2 overflow-hidden">
                        <span className="text-muted-foreground block">User Agent (Raw)</span>
                        <span className="font-mono truncate block" title={selectedLog.user_agent}>{selectedLog.user_agent || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}