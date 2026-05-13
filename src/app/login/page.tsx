"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getProfile, logActivity, saveUser } from "@/lib/db";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [step, setStep] = useState<"credentials" | "totp" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [factorId, setFactorId] = useState("");

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session && step !== "credentials") {
        router.push("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, step]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSubmittingRef.current) return;

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    isSubmittingRef.current = true;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Login error details:", authError);
        setError(`Erro ao entrar: ${authError.message}`);
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      if (data.user) {
        const factors = await supabase.auth.mfa.listFactors();
        const totpFactor = factors.data?.totp.find((f) => f.status === "verified");

        if (totpFactor) {
          setFactorId(totpFactor.id);
          setStep("totp");
          setLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        await supabase.auth.signOut();
        await handleSendEmailOtp();
      }
    } catch (err: unknown) {
      console.error("Unexpected login error:", err);
      setError("Ocorreu um erro ao entrar");
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSendEmailOtp = async () => {
    setError("");
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        console.error("OTP Error:", otpError);
        setError(`Erro ao enviar código: ${otpError.message}`);
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      setStep("otp");
      setLoading(false);
      isSubmittingRef.current = false;
    } catch (err: unknown) {
      console.error("Unexpected OTP error:", err);
      setError("Erro ao processar solicitação");
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (step === "totp") {
        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: otpCode,
        });

        if (error) throw error;
        await finalizeLogin(data.user.id);
      } else {
        console.log("Verifying OTP...", { email, code: otpCode });

        let userData;

        try {
          console.log("Attempt 1: type=email");
          const res = await supabase.auth.verifyOtp({
            email,
            token: otpCode,
            type: "email",
          });
          if (res.error) throw res.error;
          userData = res.data.user;
        } catch (err: unknown) {
          console.log("Attempt 1 failed:", getErrorMessage(err));

          try {
            console.log("Attempt 2: type=magiclink");
            const res2 = await supabase.auth.verifyOtp({
              email,
              token: otpCode,
              type: "magiclink",
            });
            if (res2.error) throw res2.error;
            userData = res2.data.user;
          } catch (err2: unknown) {
            console.log("Attempt 2 failed:", getErrorMessage(err2));
            throw err;
          }
        }

        if (userData) {
          console.log("OTP verified successfully");
          await finalizeLogin(userData.id);
        } else {
          throw new Error("Usuário não retornado após verificação");
        }
      }
    } catch (err: unknown) {
      console.log("Catch block executing in handleVerify. Error:", err);

      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session check:", session ? "Found" : "Null");

      if (session) {
        console.log("Session detected. Finalizing login...");
        await finalizeLogin(session.user.id);
        return;
      }

      console.error("No session found. Displaying error.");
      setError("Código inválido ou expirado. Tente usar o link enviado.");
      setLoading(false);
    }
  };

  const finalizeLogin = async (uid: string) => {
    const profile = await getProfile(uid);
    if (profile) {
      if (profile.status === "inativo") {
        await supabase.auth.signOut();
        setError("Sua conta está inativa. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      await logActivity(
        "LOGIN",
        "SESSAO",
        `O usuário ${profile.name} realizou login no sistema via ${step === "totp" ? "2FA (App)" : "2FA (Email)"}.`,
        profile.id,
        profile.name
      );

      await saveUser({
        id: profile.id,
        last_login: new Date().toISOString()
      });
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-950 dark:bg-black dark:text-foreground">
      <Link
        href="/"
        className="fixed left-4 top-4 z-20 inline-flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="pointer-events-none fixed inset-0 dark:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(255,93,56,0.14),transparent_34%),radial-gradient(circle_at_78%_60%,rgba(15,23,42,0.10),transparent_32%)]" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-[#070707] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 h-20 w-20">
            <Image src="/davus-logo.svg" alt="SIS DAVUS" width={48} height={48} className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">SIS DAVUS</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={step === "credentials" ? handleLogin : handleVerify} className="space-y-4">
            {step === "credentials" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 dark:border-white/10 dark:bg-[#050505]"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 dark:border-white/10 dark:bg-[#050505]"
                      autoComplete="current-password"
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

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotDialog(true)}
                  className="w-full text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Esqueci minha senha
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-semibold">
                    {step === "totp" ? "Autenticação em Duas Etapas" : "Verifique seu E-mail"}
                  </h3>
                  <p className="px-4 text-sm text-muted-foreground">
                    {step === "totp"
                      ? "Digite o código de 6 dígitos do seu aplicativo autenticador."
                      : `Enviamos um código para ${email}. Digite-o abaixo ou clique no link enviado.`}
                  </p>
                </div>

                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {error && (
                  <div className="flex w-full items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex w-full flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>
                    {loading ? "Verificando..." : "Confirmar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep("credentials");
                      setOtpCode("");
                      setError("");
                      isSubmittingRef.current = false;
                    }}
                    className="w-full"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 border-t border-border/50 pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Delta Rise
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperação de Senha</DialogTitle>
            <DialogDescription className="pt-4">
              Para recuperar sua senha, entre em contato com um administrador do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Somente administradores podem redefinir senhas de usuários.
                Solicite a alteração através dos canais internos da empresa.
              </p>
            </div>
            <Button onClick={() => setShowForgotDialog(false)} variant="outline">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
