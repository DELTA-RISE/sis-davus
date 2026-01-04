"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Short, subtle click sound (base64)
const CLICK_SOUND = "data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Placeholder, I will use a real short beep base64 below

// Real short click (mechanical)
const CLICK_BASE64 = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACQB/8A/wD/AP8A/wD/AP8AAA==";
// This is too short, I'll use a better one or just an empty one to not annoy if I can't generate a good one.
// Let's use a very simple synthesized "pop" logic or just a reliable URL if allowed.
// Since I can't guarantee URL availability, I'll use a standard browser "beep" approach using Web Audio API which is cleaner and 0kb.

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
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);

        const savedMute = localStorage.getItem("davus-sound-muted");
        if (savedMute) setIsMuted(savedMute === "true");

        return () => {
            ctx.close();
        };
    }, []);

    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        localStorage.setItem("davus-sound-muted", String(newState));
    };

    const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        if (!audioContext || isMuted) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        gain.gain.setValueAtTime(vol, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + duration);
    };

    const playClick = () => playTone(800, "sine", 0.05, 0.05); // High crisp tick
    const playHover = () => playTone(400, "sine", 0.03, 0.01); // Very subtle low tick
    const playSuccess = () => {
        if (!audioContext || isMuted) return;
        // Chime
        playTone(500, "sine", 0.2);
        setTimeout(() => playTone(800, "sine", 0.4), 100);
    };
    const playError = () => {
        if (!audioContext || isMuted) return;
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
