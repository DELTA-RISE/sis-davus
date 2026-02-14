"use client";

import { useEffect, useState } from "react";
import { useIdle } from "@/hooks/use-idle";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export function LockScreen() {
    const { lockPin } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    // Only activate idle timer if a PIN is set
    const [isIdle] = [useIdle(15 * 60 * 1000)];

    useEffect(() => {
        // Only lock if user is idle AND has a PIN configured
        if (isIdle && lockPin) {
            setIsLocked(true);
        }
    }, [isIdle, lockPin]);

    const handleUnlock = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!lockPin) {
            // Should not happen if logic is correct, but safe fallback
            setIsLocked(false);
            return;
        }

        if (pin === lockPin) {
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

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
            <div className="md:w-96 w-full max-w-sm space-y-8 p-8 text-center">
                <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                    <Lock className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">SisDavus Bloqueado</h1>
                    <p className="text-sm text-muted-foreground">Digite seu PIN para desbloquear.</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="PIN"
                            className={`text-center text-lg tracking-[0.5em] h-12 ${error ? 'border-destructive' : ''}`}
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                        Desbloquear
                    </Button>
                </form>
            </div>
        </div>
    );
}
