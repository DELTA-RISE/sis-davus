"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { saveUser } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!password || !confirmPassword) {
            setError("Preencha todos os campos");
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                throw updateError;
            }

            if (user) {
                await saveUser({
                    id: user.id,
                    must_change_password: false
                });

                // Force a refresh of the profile in context to update mustChangePassword state
                await refreshProfile();
            }

            toast.success("Senha alterada com sucesso!");
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Erro ao alterar senha");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-chart-5/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <div className="w-20 h-20 mx-auto mb-4">
                        <Image src="/davus-logo.svg" alt="SIS DAVUS" width={48} height={48} className="w-full h-full" />
                    </div>
                    <CardTitle className="text-2xl">Alterar Senha</CardTitle>
                    <CardDescription>
                        É necessário alterar sua senha no primeiro acesso
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nova senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirme a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Salvando..." : "Alterar Senha e Continuar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
