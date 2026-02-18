"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CinematicLogin } from "@/components/CinematicLogin";
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
import { Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getProfile, logActivity, saveUser } from "@/lib/db";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [step, setStep] = useState<"credentials" | "email_captcha" | "totp" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [userId, setUserId] = useState("");

  const captchaRef = useRef<HCaptcha>(null);
  const isSubmittingRef = useRef(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  // Listen for auth state changes (e.g. Magic Link clicked in another tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Avoid redirecting if we are in the middle of a multi-step flow that might trigger signed_in
        // But for Magic Link, we want to redirect.
        // If we are in TOTP step, we might be verifying, so let's check profile status first.

        // However, Magic Link sets the session directly. 
        // We should just check if we have a user and redirect.
        // We can reuse finalizeLogin logic via a simplified check or just router.push
        // But better to ensure profile check.
        if (step !== "credentials") {
          // If manual flow is in progress, we might race. 
          // But if session is established from outside, we should honor it.
          router.push("/dashboard");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, step]);

  const resetCaptcha = () => {
    setCaptchaToken("");
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSubmittingRef.current) return;

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    if (!captchaToken) {
      setError("Por favor, resolva o captcha");
      return;
    }

    setLoading(true);
    isSubmittingRef.current = true;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });

      if (authError) {
        console.error("Login error details:", authError);
        setError(`Erro ao entrar: ${authError.message}`);
        setLoading(false);
        isSubmittingRef.current = false;
        resetCaptcha();
        return;
      }

      if (data.user) {
        const factors = await supabase.auth.mfa.listFactors();
        const totpFactor = factors.data?.totp.find((f) => f.status === 'verified');

        if (totpFactor) {
          setFactorId(totpFactor.id);
          setUserId(data.user.id);
          setStep("totp");
          setLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        // Se não tem TOTP, precisamos validar o captcha NOVAMENTE para enviar o email
        await supabase.auth.signOut(); // Limpa sessão parcial (security requirement for clean signInWithOtp)

        setStep("email_captcha");
        setUserId(data.user.id);
        setLoading(false);
        isSubmittingRef.current = false;
        resetCaptcha(); // Prepare for second captcha
      }
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      setError("Ocorreu um erro ao entrar");
      setLoading(false);
      isSubmittingRef.current = false;
      resetCaptcha();
    }
  };

  const handleSendEmailOtp = async (token: string) => {
    setError("");
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          captchaToken: token,
        },
      });

      if (otpError) {
        console.error("OTP Error:", otpError);
        setError(`Erro ao enviar código: ${otpError.message}`);
        setLoading(false);
        isSubmittingRef.current = false;
        resetCaptcha();
        return;
      }

      setStep("otp");
      setLoading(false);
      isSubmittingRef.current = false;
    } catch (err: any) {
      console.error("Unexpected OTP error:", err);
      setError("Erro ao processar solicitação");
      setLoading(false);
      isSubmittingRef.current = false;
      resetCaptcha();
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
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: "email",
        });

        if (error) throw error;
        if (data.user) await finalizeLogin(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || "Código inválido");
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
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
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
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                    onVerify={(token) => {
                      setCaptchaToken(token);
                      setError("");
                    }}
                    onExpire={() => setCaptchaToken("")}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotDialog(true)}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
              </>
            ) : step === "email_captcha" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Verificação de Segurança</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Para garantir que você não é um robô, resolva o captcha abaixo para receber o código de acesso no seu e-mail.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg w-full">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex justify-center w-full py-4">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                    onVerify={(token) => handleSendEmailOtp(token)}
                    onExpire={() => setCaptchaToken("")}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("credentials");
                    setEmail("");
                    setPassword("");
                    setError("");
                    resetCaptcha();
                  }}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    {step === "totp" ? "Autenticação em Duas Etapas" : "Verifique seu E-mail"}
                  </h3>
                  <p className="text-sm text-muted-foreground px-4">
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
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg w-full">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
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
                      resetCaptcha(); // Ensure fresh start
                    }}
                    className="w-full"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
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
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
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
      <CinematicLogin isLoading={loading} onComplete={() => { }} />
    </div>
  );
}
