"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/dexie-db";
import { getServerCounts } from "@/actions/diagnostics";
import { processSyncQueue } from "@/lib/offline-sync";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Database, Cloud, Trash2, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";

const TABLES = [
    "products",
    "assets",
    "stock_movements",
    "maintenance_tasks",
    "checkouts",
    "cost_centers",
    "admin_audit_logs",
    "profiles",
    "asset_timelines"
];

const TABLE_LABELS: Record<string, string> = {
    products: "Produtos",
    assets: "Patrimônios",
    stock_movements: "Movimentações",
    maintenance_tasks: "Manutenção",
    checkouts: "Checkouts",
    cost_centers: "Centros de Custo",
    admin_audit_logs: "Logs de Auditoria",
    profiles: "Usuários",
    asset_timelines: "Histórico de Ativos"
};

export default function SyncStatusPage() {
    const [serverCounts, setServerCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Live query for local counts and queue
    const localStats = useLiveQuery(async () => {
        const counts: Record<string, number> = {};
        for (const table of TABLES) {
            if (table === 'products' || table === 'assets') {
                const items = await db.table(table).toArray();
                counts[table] = items.filter((i: any) => !i.deleted_at).length;
            } else {
                counts[table] = await db.table(table).count();
            }
        }
        const pendingCount = await db.sync_queue.where('status').equals('pending').count();
        const failedCount = await db.sync_queue.where('status').equals('failed').count();
        return { counts, pendingCount, failedCount };
    });

    const fetchServerStats = async () => {
        setIsLoading(true);
        const result = await getServerCounts();
        if (result.success && result.counts) {
            setServerCounts(result.counts);
            toast.success("Dados do servidor atualizados");
        } else {
            toast.error("Erro ao buscar dados do servidor");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchServerStats();
    }, []);

    const handleManualSync = async () => {
        setIsLoading(true);
        await processSyncQueue();
        await fetchServerStats(); // Refresh server stats after sync
        setIsLoading(false);
    };

    const handleResetLocal = async () => {
        if (!confirm("Isso apagará TODO o banco de dados local e recarregará a página. Tem certeza?")) return;

        setIsResetting(true);
        try {
            await db.delete();
            await db.open();
            window.location.reload();
        } catch (error) {
            console.error("Failed to reset DB:", error);
            toast.error("Erro ao resetar banco de dados");
            setIsResetting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                        Status de Sincronização
                    </h1>
                    <p className="text-muted-foreground">
                        Diagnóstico do banco de dados local (Dexie) vs Nuvem (Supabase).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchServerStats} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar Status
                    </Button>
                    <Button onClick={handleManualSync} disabled={isLoading || (localStats?.pendingCount === 0 && localStats?.failedCount === 0)}>
                        Forçar Sincronização
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pendente Envio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{localStats?.pendingCount ?? '-'}</div>
                        <p className="text-xs text-muted-foreground">Itens na fila de sincronização</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Falhas de Sync</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{localStats?.failedCount ?? '-'}</div>
                        <p className="text-xs text-muted-foreground">Itens que falharam ao enviar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saúde do Cache</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Ativo</div>
                        <p className="text-xs text-muted-foreground">Dexie DB v{db.verno}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Integridade de Dados</CardTitle>
                    <CardDescription>
                        Comparativo de registros entre o cache local e o servidor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entidade</TableHead>
                                <TableHead className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Database className="h-4 w-4 text-blue-500" />
                                        Local (Dexie)
                                    </div>
                                </TableHead>
                                <TableHead className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Cloud className="h-4 w-4 text-green-500" />
                                        Servidor (Supabase)
                                    </div>
                                </TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {TABLES.map((table) => {
                                const local = localStats?.counts?.[table] ?? 0;
                                const server = serverCounts[table] ?? -1;
                                const isMatch = local === server;
                                const isLoadingServer = server === undefined; // Not fetched yet (object is empty initially or specific key missing) -> actually simplified state init uses {}

                                return (
                                    <TableRow key={table}>
                                        <TableCell className="font-medium">{TABLE_LABELS[table] || table}</TableCell>
                                        <TableCell className="text-center">{local}</TableCell>
                                        <TableCell className="text-center">
                                            {server === -1 ? (
                                                <span className="text-red-500 text-xs">Erro</span>
                                            ) : (
                                                server
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {server !== -1 && (
                                                <Badge variant={isMatch ? "outline" : "destructive"} className={isMatch ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
                                                    {isMatch ? "Sincronizado" : "Divergente"}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                        <div>
                            <h3 className="font-bold text-red-700 dark:text-red-400">Zona de Perigo</h3>
                            <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                Se o banco de dados local estiver corrompido, você pode resetá-lo.
                                Isso apagará o cache local e baixará tudo do servidor novamente.
                            </p>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={handleResetLocal} disabled={isResetting}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Resetar Cache Local
                    </Button>
                </div>
            </div>
        </div>
    );
}
