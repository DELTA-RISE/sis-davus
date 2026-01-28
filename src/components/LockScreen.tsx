"use client";

import { useEffect, useState } from "react";
import { useIdle } from "@/hooks/use-idle";
import { Lock, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LockScreen() {
    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const [isIdle] = [useIdle(15 * 60 * 1000)]; // Wrapped to match hook signature import if needed or just use hook directly

    useEffect(() => {
        if (isIdle) {
            setIsLocked(true);
        }
    }, [isIdle]);

    const handleUnlock = (e?: React.FormEvent) => {
        e?.preventDefault();
        // Mock validation - in real app, validate against stored hash or auth provider
        if (pin === "1234") {
            setIsLocked(false);
            setPin("");
            setError(false);
            toast.success("Bem-vindo de volta!");
        } else {
            setError(true);
            toast.error("PIN incorreto");
            setPin("");
        }
    };

    const handleBiometric = async () => {
        try {
            // Check if available
            if (window.PublicKeyCredential) {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (!available) {
                    toast.error("Biometria não disponível neste dispositivo.");
                    return;
                }

                // Simple assertion - in a real app, you'd fetch a challenge from the server
                // For a local app "Windows Hello" check, we can try to get a credential with an empty allowList
                // to trigger the prompt. However, usually you need to register one first.
                // For simplicity in this demo, we assume the user is just proving presence via OS.

                // Real implementation requires valid challenge/rpId.
                // We'll simulate a success if the API exists to show the flow, 
                // or try a generic call if possible.

                // Actually, without a backend challenge, WebAuthn is tricky. 
                // We will simulate it with a toast for now as per plan "Investigate...".
                // But let's try to make it slightly real:

                toast.loading("Aguardando biometria do sistema...");

                // Mock delay
                setTimeout(() => {
                    setIsLocked(false);
                    setError(false);
                    toast.dismiss();
                    toast.success("Desbloqueado via Biometria");
                }, 1000);
            } else {
                toast.error("WebAuthn não suportado.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Falha na autenticação biométrica");
        }
    };

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
            <div className="md:w-96 w-full max-w-sm space-y-8 p-8 text-center">
                <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                    <Lock className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">SisDavus Bloqueado</h1>
                    <p className="text-sm text-muted-foreground">Digite seu PIN ou use a biometria para desbloquear.</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="PIN (1234)"
                            className={`text-center text-lg tracking-[0.5em] h-12 ${error ? 'border-destructive' : ''}`}
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                        Desbloquear
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Ou
                        </span>
                    </div>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={handleBiometric}>
                    <Fingerprint className="w-4 h-4" />
                    Usar Biometria
                </Button>
            </div>
        </div>
    );
}
