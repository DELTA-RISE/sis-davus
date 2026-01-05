"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { saveUser } from "@/lib/db";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Lock,
    User,
    Shield,
    Bell,
    Eye,
    EyeOff,
    Save,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function AccountSettingsPage() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Notification State
    const [emailNotifs, setEmailNotifs] = useState(false);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Load preferences on mount
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const savedEmail = localStorage.getItem('sis_davus_email_notifs');
            const savedPush = localStorage.getItem('sis_davus_push_notifs');

            // Default to true if not set, otherwise parse boolean
            setEmailNotifs(savedEmail === null ? true : savedEmail === 'true');
            setPushNotifs(savedPush === 'true');
        }
    }, []);

    const handleNotificationChange = (type: 'email' | 'push', value: boolean) => {
        if (type === 'email') {
            setEmailNotifs(value);
            localStorage.setItem('sis_davus_email_notifs', String(value));
        } else {
            setPushNotifs(value);
            localStorage.setItem('sis_davus_push_notifs', String(value));
            if (value) {
                // Request permission if enabling
                if ("Notification" in window) {
                    Notification.requestPermission().then(permission => {
                        if (permission !== 'granted') {
                            toast.error("Permissão de notificação negada pelo navegador.");
                            setPushNotifs(false);
                            localStorage.setItem('sis_davus_push_notifs', 'false');
                        }
                    });
                }
            }
        }
        toast.success("Preferência salva!");
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error("Preencha todos os campos de senha");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        setIsChangingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast.success("Senha alterada com sucesso!");
            setPassword("");
            setConfirmPassword("");

            // Update DB to ensure must_change_password is false if it wasn't already
            if (user) {
                await saveUser({
                    id: user.id,
                    must_change_password: false
                });
                await refreshProfile();
            }

        } catch (error: any) {
            toast.error(error.message || "Erro ao alterar senha");
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto pb-24 md:pb-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/perfil">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Configurações da Conta</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie suas credenciais e preferências
                        </p>
                    </div>
                </div>

                {/* Security Section */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <Shield className="h-5 w-5 text-red-500" />
                            </div>
                            <CardTitle className="text-lg">Segurança</CardTitle>
                        </div>
                        <CardDescription>
                            Proteja sua conta alterando sua senha regularmente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirm-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Digite novamente"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isChangingPassword || !password || !confirmPassword}
                                    className="w-full sm:w-auto"
                                >
                                    {isChangingPassword ? (
                                        "Atualizando..."
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Atualizar Senha
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Bell className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-lg">Notificações</CardTitle>
                        </div>
                        <CardDescription>
                            Escolha como você deseja ser notificado sobre atualizações do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="email-notifs" className="flex flex-col space-y-1">
                                <span>Notificações por E-mail</span>
                                <span className="font-normal text-xs text-muted-foreground">Receba relatórios e alertas importantes por e-mail.</span>
                            </Label>
                            <Switch
                                id="email-notifs"
                                checked={emailNotifs}
                                onCheckedChange={(val) => handleNotificationChange('email', val)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="push-notifs" className="flex flex-col space-y-1">
                                <span>Notificações Push</span>
                                <span className="font-normal text-xs text-muted-foreground">Receba alertas em tempo real no seu navegador.</span>
                            </Label>
                            <Switch
                                id="push-notifs"
                                checked={pushNotifs}
                                onCheckedChange={(val) => handleNotificationChange('push', val)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            * As preferências são salvas neste dispositivo.
                        </p>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
