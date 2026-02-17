"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { saveUser } from "@/lib/db";
import { User as AppUser } from "@/lib/store";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import QRCode from 'qrcode';
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
    Shield,
    Bell,
    Eye,
    EyeOff,
    Save,
    Laptop,
    Trash2,
    QrCode,
    FileClock,
    Download,
    Smartphone
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function AccountSettingsPage() {
    // const router = useRouter();
    const { user, refreshProfile, lockPin } = useAuth();
    //...

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // 2FA Verification State for Sensitive Actions
    const [is2FARequiredForAction, setIs2FARequiredForAction] = useState(false);
    const [actionVerifyCode, setActionVerifyCode] = useState("");

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
            // Check if 2FA is enabled before proceeding
            if (!is2FARequiredForAction) {
                const { data: factors } = await supabase.auth.mfa.listFactors();
                const totpFactor = factors?.totp.find(f => f.status === 'verified');

                if (totpFactor) {
                    setIs2FARequiredForAction(true);
                    setIsChangingPassword(false);
                    toast.info("Por segurança, confirme seu código 2FA.");
                    return;
                }
            }

            // If required, verify the code
            if (is2FARequiredForAction) {
                if (!actionVerifyCode || actionVerifyCode.length < 6) {
                    toast.error("Digite o código 2FA");
                    setIsChangingPassword(false);
                    return;
                }

                const { data: factors } = await supabase.auth.mfa.listFactors();
                const totpFactor = factors?.totp.find(f => f.status === 'verified');

                if (totpFactor) {
                    const { error } = await supabase.auth.mfa.challengeAndVerify({
                        factorId: totpFactor.id,
                        code: actionVerifyCode
                    });

                    if (error) {
                        toast.error("Código 2FA incorreto.");
                        setIsChangingPassword(false);
                        return;
                    }
                }
            }

            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast.success("Senha alterada com sucesso!");
            setPassword("");
            setConfirmPassword("");
            setIs2FARequiredForAction(false);
            setActionVerifyCode("");

            // Update DB to ensure must_change_password is false if it wasn't already
            if (user) {
                await saveUser({
                    id: user.id,
                    must_change_password: false
                });
                await refreshProfile();
            }

        } catch (error: unknown) {
            toast.error((error as Error).message || "Erro ao alterar senha");
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

                            {is2FARequiredForAction && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-orange-500">Confirmação 2FA Necessária</Label>
                                    <div className="relative">
                                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                                        <Input
                                            value={actionVerifyCode}
                                            onChange={(e) => setActionVerifyCode(e.target.value)}
                                            placeholder="000 000"
                                            maxLength={6}
                                            className="pl-10 font-mono border-orange-200 focus-visible:ring-orange-500"
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Para sua segurança, valide seu código authenticator para alterar a senha.
                                    </p>
                                </div>
                            )}

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

                {/* PIN Lock */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Lock className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-lg">Bloqueio de Tela (AFK)</CardTitle>
                        </div>
                        <CardDescription>
                            Defina um PIN numérico para desbloquear a tela após inatividade.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PinSettings user={user} lockPin={lockPin} refreshProfile={refreshProfile} />
                    </CardContent>
                </Card>

                {/* 2FA */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <QrCode className="h-5 w-5 text-orange-500" />
                            </div>
                            <CardTitle className="text-lg">Autenticação em Dois Fatores (2FA)</CardTitle>
                        </div>
                        <CardDescription>
                            Adicione uma camada extra de segurança à sua conta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <TwoFactorAuth user={user} />
                    </CardContent>
                </Card>

                {/* Active Sessions */}
                {/* Active Sessions */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <Laptop className="h-5 w-5 text-emerald-500" />
                            </div>
                            <CardTitle className="text-lg">Sessões Ativas</CardTitle>
                        </div>
                        <CardDescription>
                            Dispositivos onde você está conectado atualmente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActiveSessionsList />
                    </CardContent>
                </Card>

                {/* Access Logs */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/10">
                                <FileClock className="h-5 w-5 text-violet-500" />
                            </div>
                            <CardTitle className="text-lg">Logs de Acesso</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                                <div>Data</div>
                                <div>Dispositivo</div>
                                <div>IP</div>
                            </div>
                            <div className="text-sm max-h-60 overflow-y-auto">
                                <AccessLogsList userId={user?.id} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Data */}
                <Card className="border-border/50 bg-card/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-500/10">
                                <Download className="h-5 w-5 text-teal-500" />
                            </div>
                            <CardTitle className="text-lg">Meus Dados</CardTitle>
                        </div>
                        <CardDescription>
                            Gerencie seus dados pessoais conforme a LGPD.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Exportar Dados</Label>
                                <p className="text-xs text-muted-foreground">Baixe uma cópia de todos os seus dados.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleExportData(user)}>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar JSON
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Expanded */}
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
                        <Separator />
                        <div className="space-y-3">
                            <Label>Tipos de Alerta</Label>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="notif-crit" className="font-normal text-xs">Críticos (Estoque Zero, Falhas)</Label>
                                    <Switch id="notif-crit" defaultChecked disabled />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="notif-warn" className="font-normal text-xs">Avisos (Estoque Baixo, Manutenção)</Label>
                                    <Switch id="notif-warn" defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="notif-info" className="font-normal text-xs">Informativos (Novos Usuários)</Label>
                                    <Switch id="notif-info" />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2 pt-2">
                            <Label>Horário de Silêncio</Label>
                            <div className="flex items-center gap-2">
                                <Input type="time" className="w-24" defaultValue="22:00" />
                                <span className="text-xs text-muted-foreground">até</span>
                                <Input type="time" className="w-24" defaultValue="07:00" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Não enviar notificações push neste período.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            * As preferências são salvas neste dispositivo.
                        </p>
                    </CardFooter>
                </Card>

                {/* Danger Zone */}
                <div className="pt-6">
                    <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 overflow-hidden">
                        <div className="p-4 md:p-6 flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Zona de Perigo</h3>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Ações irreversíveis relacionadas à sua conta.
                                </p>
                            </div>
                        </div>
                        <div className="px-4 md:px-6 pb-6 pt-2">
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-red-100 dark:border-red-900/20">
                                <div>
                                    <p className="font-medium text-sm">Excluir minha conta</p>
                                    <p className="text-xs text-muted-foreground">
                                        Todos os seus dados pessoais serão removidos permanentemente.
                                    </p>
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => toast.error("Entre em contato com o suporte para excluir sua conta (Restrição Admin).")}>
                                    Excluir Conta
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function PinSettings({ user, lockPin, refreshProfile }: { user: SupabaseUser | null, lockPin: string | null | undefined, refreshProfile: () => Promise<void> }) {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const hasPin = !!lockPin;

    const handleSavePin = async () => {
        if (pin.length < 4 || pin.length > 6) {
            toast.error("O PIN deve ter entre 4 e 6 dígitos.");
            return;
        }
        if (pin !== confirmPin) {
            toast.error("Os PINs não coincidem.");
            return;
        }


        setLoading(true);
        if (!user) return;
        try {
            await saveUser({ id: user.id, lock_pin: pin });
            await refreshProfile();
            toast.success("PIN de bloqueio salvo com sucesso!");
            setIsEditing(false);
            setPin("");
            setConfirmPin("");
        } catch (_) {
            toast.error("Erro ao salvar PIN.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePin = async () => {
        if (!confirm("Remover o bloqueio por PIN?")) return;
        setLoading(true);
        if (!user) return;
        try {
            await saveUser({ id: user.id, lock_pin: null } as unknown as Partial<AppUser>); // cast null for partial update
            await refreshProfile();
            toast.success("PIN removido.");
        } catch (_) {
            toast.error("Erro ao remover PIN.");
        } finally {
            setLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="space-y-4 max-w-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Novo PIN</Label>
                        <Input
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="4-6 dígitos"
                            maxLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Confirmar</Label>
                        <Input
                            type="password"
                            inputMode="numeric"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="Repita o PIN"
                            maxLength={6}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleSavePin} disabled={loading}>
                        Salvar PIN
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        Cancelar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-sm">Status: <span className={hasPin ? "text-emerald-500 font-bold" : "text-yellow-500"}>{hasPin ? "Configurado" : "Não Configurado"}</span></p>
                <p className="text-xs text-muted-foreground">{hasPin ? "Sua tela será bloqueada com este PIN." : "Configure para proteger sua sessão."}</p>
            </div>
            <div className="flex gap-2">
                {hasPin && (
                    <Button variant="destructive" size="sm" onClick={handleRemovePin} disabled={loading}>
                        Remover
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={loading}>
                    {hasPin ? "Alterar PIN" : "Configurar PIN"}
                </Button>
            </div>
        </div>
    );
}



function TwoFactorAuth({ user }: { user: SupabaseUser | null }) {
    const [factorId, setFactorId] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle');


    const checkStatus = useCallback(async () => {
        if (!user) return;

        const { data: _assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        const { data: factors } = await supabase.auth.mfa.listFactors();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totpFactor = factors?.totp.find((f: any) => f.status === 'verified');
        setIsEnabled(!!totpFactor);
        if (totpFactor) setFactorId(totpFactor.id);
    }, [user]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const startEnrollment = async () => {
        setLoading(true);
        try {
            // Cleanup any unverified factors first to avoid collision
            const { data: factors } = await supabase.auth.mfa.listFactors();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const unverifiedFactors = factors?.totp.filter((f: any) => f.status === 'unverified') || [];

            for (const factor of unverifiedFactors) {
                await supabase.auth.mfa.unenroll({ factorId: factor.id });
            }

            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            });
            if (error) throw error;

            setFactorId(data.id);

            // Generate QR Code
            const url = await QRCode.toDataURL(data.totp.uri);
            setQrCodeUrl(url);
            setStep('enrolling');
        } catch (e: unknown) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (factorId) {
            setLoading(true);
            try {
                // If we are canceling enrollment, we must clean up the factor we just created
                // otherwise it stays as 'unverified' and blocks future attempts.
                await supabase.auth.mfa.unenroll({ factorId });
            } catch (e) {
                console.error("Error cleaning up factor", e);
            } finally {
                setLoading(false);
            }
        }
        setStep('idle');
        setQrCodeUrl(null);
        setFactorId(null);
        setVerifyCode("");
    };

    const verifyEnrollment = async () => {
        if (!factorId || !verifyCode) return;
        setLoading(true);
        try {
            const { data: _data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: factorId,
                code: verifyCode,
            });
            if (error) throw error;

            toast.success("2FA Ativado com sucesso!");
            setIsEnabled(true);
            setStep('idle');
            setQrCodeUrl(null);
            setVerifyCode("");
        } catch {
            toast.error("Código inválido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }
    const disable2FA = async () => {
        if (!factorId) return;
        if (!confirm("Tem certeza que deseja desativar o 2FA?")) return;

        setLoading(true);
        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId });
            if (error) throw error;

            toast.success("2FA Desativado.");
            setIsEnabled(false);
            setFactorId(null);
        } catch (e: unknown) {
            toast.error("Erro ao desativar: " + (e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (isEnabled) {
        return (
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium text-sm">Status: <span className="text-emerald-500 font-bold">Ativado</span></p>
                    <p className="text-xs text-muted-foreground">Sua conta está mais segura.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={disable2FA} disabled={loading}>
                    Desativar 2FA
                </Button>
            </div>
        );
    }
    if (step === 'enrolling') {
        return (
            <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                <div className="text-center space-y-2">
                    <p className="font-semibold text-sm">Escaneie o QR Code</p>
                    {qrCodeUrl && (
                        <div className="flex justify-center bg-white p-2 rounded-lg w-fit mx-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrCodeUrl} alt="QR Code 2FA" className="w-40 h-40" />
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Use o Google Authenticator ou Authy.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label>Código de Verificação</Label>
                    <div className="flex gap-2">
                        <Input
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            placeholder="000 000"
                            className="text-center letter-spacing-2 font-mono"
                            maxLength={6}
                        />
                        <Button onClick={verifyEnrollment} disabled={loading || verifyCode.length < 6}>
                            {loading ? "..." : "Ativar"}
                        </Button>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleCancel} disabled={loading}>
                    {loading ? "Limpando..." : "Cancelar"}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-sm">Status: <span className="text-red-500">Desativado</span></p>
                <p className="text-xs text-muted-foreground">Recomendamos ativar para proteger seus dados.</p>
            </div>
            <Button variant="outline" size="sm" onClick={startEnrollment} disabled={loading}>
                Configurar 2FA
            </Button>
        </div>
    );
}

function AccessLogsList({ userId }: { userId?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        supabase
            .from('access_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)
            .then(({ data }) => {
                if (data) setLogs(data);
                setLoading(false);
            });
    }, [userId]);

    if (loading) return <div className="p-4 text-center text-xs text-muted-foreground">Carregando logs...</div>;

    if (logs.length === 0) return <div className="p-4 text-center text-xs text-muted-foreground">Nenhum registro encontrado.</div>;

    return (
        <>
            {logs.map((log) => (
                <div key={log.id} className="grid grid-cols-3 gap-2 p-3 border-t hover:bg-muted/30 text-xs">
                    <div>{new Date(log.created_at).toLocaleString()}</div>
                    <div title={log.user_agent}>{log.device_info || "Navegador Web"}</div>
                    <div className="font-mono text-muted-foreground">{log.ip_address}</div>
                </div>
            ))}
        </>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleExportData = async (user: any) => {
    if (!user) return;
    toast.promise(
        async () => {
            const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
            const { data: logs } = await supabase.from('access_logs').select('*').eq('user_id', user.id);
            // Add more data queries here if needed

            const exportData = {
                user: user,
                profile: profile,
                access_logs: logs,
                exported_at: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sisdavus-data-${user.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        {
            loading: 'Gerando arquivo de exportação...',
            success: 'Dados exportados com sucesso!',
            error: 'Erro ao exportar dados.'
        }
    );
};

function ActiveSessionsList() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_my_sessions');
        if (!error && data) {
            setSessions(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleRevoke = async (sessionId: string) => {
        if (!confirm("Tem certeza que deseja desconectar esta sessão?")) return;

        try {
            const { data, error } = await supabase.rpc('revoke_my_session', { session_id: sessionId });
            if (error) throw error;

            if (data === false) {
                toast.error("Sessão não encontrada ou já removida.");
            } else {
                toast.success("Sessão desconectada.");
            }
            await fetchSessions();
        } catch (e) {
            toast.error("Erro ao desconectar sessão.");
            console.error(e);
        }
    };

    if (loading) return <div className="p-4 text-center text-xs text-muted-foreground">Carregando sessões...</div>;

    if (sessions.length === 0) return <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma sessão encontrada.</div>;

    return (
        <div className="space-y-3">
            {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg border">
                            {/Android|iPhone|iPad|Mobile/i.test(session.user_agent) ? (
                                <Smartphone className={`h-5 w-5 ${session.is_current ? "text-emerald-500" : "text-muted-foreground"}`} />
                            ) : (
                                <Laptop className={`h-5 w-5 ${session.is_current ? "text-emerald-500" : "text-muted-foreground"}`} />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                                {session.ip}
                                {session.is_current && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">Atual</span>}
                            </p>
                            <div className="text-xs text-muted-foreground" title={session.user_agent}>
                                <p className="truncate max-w-[200px]">{session.user_agent}</p>
                                <p className="truncate max-w-[200px]">{session.user_agent}</p>
                                <p>Iniciado: {new Date(session.created_at).toLocaleDateString()} • Último acesso: {new Date(session.last_active_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        {session.is_current ? (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse block" title="Atual" />
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleRevoke(session.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
