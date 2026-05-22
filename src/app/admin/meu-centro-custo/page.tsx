"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCostCenters, getUsers } from "@/lib/db";
import { CostCenter, User } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Mail, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getRoleLabel } from "@/lib/roles";

export default function MyCostCenterPage() {
    const { costCenter, isLoading: authLoading } = useAuth();
    const [myCenter, setMyCenter] = useState<CostCenter | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (authLoading) return;

            if (!costCenter) {
                setLoading(false);
                return;
            }

            try {
                const [centers, allUsers] = await Promise.all([
                    getCostCenters(),
                    getUsers()
                ]);

                const foundCenter = centers.find(c => c.id === costCenter);
                if (foundCenter) {
                    setMyCenter(foundCenter);
                    const relatedUsers = allUsers.filter(u => u.cost_center === foundCenter.id);
                    setMembers(relatedUsers);
                }
            } catch (error) {
                console.error("Failed to load cost center data", error);
                toast.error("Erro ao carregar dados do centro de custo");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [costCenter, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!costCenter || !myCenter) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-8">
                <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold mb-2">Nenhum Centro de Custo Vinculado</h2>
                <p className="text-center max-w-md">
                    Você não está vinculado a nenhum centro de custo no momento. Entre em contato com um administrador se acredita que isso é um erro.
                </p>
            </div>
        );
    }

    const responsible = members.find(u => u.id === myCenter.responsible_id);
    const otherMembers = members.filter(u => u.id !== myCenter.responsible_id);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Briefcase className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{myCenter.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={myCenter.status === 'ativo' ? 'default' : 'secondary'}>
                            {myCenter.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {myCenter.description && (
                            <span className="text-sm text-muted-foreground border-l pl-2 ml-1">
                                {myCenter.description}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                Membros da Equipe
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Responsible Section */}
                                {responsible ? (
                                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                        <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Responsável</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                                                {responsible.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">{responsible.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {responsible.email}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                                                {getRoleLabel(responsible.role)}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground text-sm">
                                        Nenhum responsável definido para este centro de custo.
                                    </div>
                                )}

                                {/* Other Members */}
                                {otherMembers.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Outros Membros ({otherMembers.length})</h3>
                                        <div className="grid gap-3">
                                            {otherMembers.map(member => (
                                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-medium">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {getRoleLabel(member.role)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State for members */}
                                {!responsible && otherMembers.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p>Não há membros vinculados a este centro de custo.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Total de Membros</span>
                                <span className="font-medium">{members.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={myCenter.status === 'ativo' ? "text-green-600 font-medium text-sm" : "text-muted-foreground text-sm"}>
                                    {myCenter.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
