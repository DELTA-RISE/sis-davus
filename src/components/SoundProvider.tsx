"use client";

import { createContext, useContext, useEffect, useState } from "react";



interface SoundContextType {
    playClick: () => void;
    playHover: () => void;
    playSuccess: () => void;
    playError: () => void;
    isMuted: boolean;
    toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const savedMute = localStorage.getItem("davus-sound-muted");
        if (savedMute) setIsMuted(savedMute === "true");

        return () => {
            if (audioContext) {
                audioContext.close();
            }
        };
    }, [audioContext]);

    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        localStorage.setItem("davus-sound-muted", String(newState));
    };

    const initAudioContext = () => {
        if (!audioContext) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            setAudioContext(ctx);
            return ctx;
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    };

    const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        if (isMuted) return;

        const ctx = initAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    const playClick = () => playTone(800, "sine", 0.05, 0.05); // High crisp tick
    const playHover = () => playTone(400, "sine", 0.03, 0.01); // Very subtle low tick
    const playSuccess = () => {
        if (isMuted) return;
        // Chime
        playTone(500, "sine", 0.2);
        setTimeout(() => playTone(800, "sine", 0.4), 100);
    };
    const playError = () => {
        if (isMuted) return;
        playTone(150, "sawtooth", 0.3, 0.1);
    };

    return (
        <SoundContext.Provider value={{ playClick, playHover, playSuccess, playError, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error("useSound must be used within a SoundProvider");
    }
    return context;
}
