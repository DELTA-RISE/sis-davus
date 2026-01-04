"use client";

import { useState } from "react";
import { getProducts, getAssets, getMovements, getMaintenanceTasks } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface QueryResult {
    name: string;
    duration: number;
    recordCount: number;
    status: "success" | "error" | "pending";
    error?: string;
    fromCache: boolean;
}

export default function DiagnosticoPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<QueryResult[]>([]);
    const [totalTime, setTotalTime] = useState(0);

    const measureQuery = async (
        name: string,
        queryFn: () => Promise<any[]>,
        forceRefresh = false
    ): Promise<QueryResult> => {
        const start = performance.now();
        try {
            const data = await queryFn();
            const end = performance.now();
            const duration = end - start;

            return {
                name,
                duration: Math.round(duration),
                recordCount: data.length,
                status: "success",
                fromCache: !forceRefresh && duration < 50, // Assuming cache is very fast
            };
        } catch (error) {
            const end = performance.now();
            return {
                name,
                duration: Math.round(end - start),
                recordCount: 0,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
                fromCache: false,
            };
        }
    };

    const runDiagnostics = async (useCache: boolean) => {
        setIsRunning(true);
        setResults([]);
        setTotalTime(0);

        const queryTests = [
            { name: "Products", fn: () => getProducts(!useCache) },
            { name: "Assets", fn: () => getAssets(!useCache) },
            { name: "Movements", fn: () => getMovements(!useCache) },
            { name: "Maintenance Tasks", fn: () => getMaintenanceTasks(undefined, !useCache) },
        ];

        const overallStart = performance.now();
        const testResults: QueryResult[] = [];

        // Test sequentially to measure individual query times
        for (const test of queryTests) {
            const result = await measureQuery(test.name, test.fn, !useCache);
            testResults.push(result);
            setResults([...testResults]);
        }

        const overallEnd = performance.now();
        setTotalTime(Math.round(overallEnd - overallStart));
        setIsRunning(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
        }
    };

    const averageTime = results.length > 0
        ? Math.round(results.reduce((acc, r) => acc + r.duration, 0) / results.length)
        : 0;

    return (
        <div className="min-h-screen bg-background/50 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Diagnóstico de Performance</h1>
                    <p className="text-muted-foreground">
                        Ferramenta para medir a velocidade das queries do Supabase e eficácia do cache
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTime}ms</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalTime > 2000 ? "🔴 Muito lento" : totalTime > 1000 ? "🟡 Aceitável" : "🟢 Rápido"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio/Query</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{averageTime}ms</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {results.length} queries executadas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Cache Hits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {results.filter(r => r.fromCache).length}/{results.length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {results.length > 0
                                    ? `${Math.round((results.filter(r => r.fromCache).length / results.length) * 100)}% dos dados`
                                    : "Aguardando teste"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Controles de Teste</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <Button
                                onClick={() => runDiagnostics(true)}
                                disabled={isRunning}
                                className="flex-1"
                            >
                                {isRunning ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                )}
                                Testar COM Cache
                            </Button>
                            <Button
                                onClick={() => runDiagnostics(false)}
                                disabled={isRunning}
                                variant="outline"
                                className="flex-1"
                            >
                                {isRunning ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                )}
                                Testar SEM Cache (Force Refresh)
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                            <p className="font-medium mb-2">📊 Interpretação dos Resultados:</p>
                            <ul className="space-y-1 text-xs">
                                <li>• <strong>Tempo Total</strong>: Quanto tempo o usuário espera vendo o skeleton</li>
                                <li>• <strong>&lt; 500ms</strong>: Excelente - imperceptível para o usuário</li>
                                <li>• <strong>500-1500ms</strong>: Bom - experiência aceitável</li>
                                <li>• <strong>&gt; 1500ms</strong>: Ruim - usuário percebe demora</li>
                                <li>• <strong>Cache Hit</strong>: Query respondida em &lt;50ms (do cache local)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {results.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultados Detalhados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Query</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Tempo (ms)</TableHead>
                                        <TableHead className="text-right">Registros</TableHead>
                                        <TableHead className="text-center">Cache</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((result, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{result.name}</TableCell>
                                            <TableCell className="text-center">
                                                {getStatusIcon(result.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={result.duration > 1000 ? "destructive" : result.duration > 500 ? "secondary" : "default"}>
                                                    {result.duration}ms
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {result.recordCount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {result.fromCache ? (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">
                                                        ✓ Cache
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-600">
                                                        ↓ Network
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {results.some(r => r.status === "error") && (
                                <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                                    <p className="text-sm font-medium text-destructive mb-2">⚠️ Erros Detectados:</p>
                                    {results
                                        .filter(r => r.status === "error")
                                        .map((r, idx) => (
                                            <p key={idx} className="text-xs text-destructive/80">
                                                • {r.name}: {r.error}
                                            </p>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
