"use client";

import { useCallback } from "react";

export function useUiSound() {
    const playHoverSound = useCallback(() => {
        try {
            if (typeof window === "undefined") return;

            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            // Se não houver interação prévia, o contexto pode estar suspenso. Ele retoma silenciosamente.
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => { });
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Som grave estilo "woosh" muito rápido e contido
            osc.type = "sine";
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            // Ignorar erros caso o navegador bloqueie
        }
    }, []);

    const playClickSound = useCallback(() => {
        try {
            if (typeof window === "undefined") return;

            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => { });
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Som tipo "click/tick" agudo
            osc.type = "triangle";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // Ignorar
        }
    }, []);

    return { playHoverSound, playClickSound };
}
