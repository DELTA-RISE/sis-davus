"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Check, Loader2 } from "lucide-react";

const logs = [
    { text: "Initializing SIS DAVUS Protocol v4.0...", delay: 800 },
    { text: "Establishing secure handshake with Delta Rise Core...", delay: 1200 },
    { text: "Verifying user credentials encryption...", delay: 1000 },
    { text: "Syncing asset database shards...", delay: 1500 },
    { text: "Optimizing local cache for offline access...", delay: 1200 },
    { text: "Connection stabilized. Latency: 12ms", delay: 1000, type: "success" },
    { text: "System ready. Welcome, Operator.", delay: 2000, type: "success" },
];

export function TypingTerminal() {
    const [lines, setLines] = useState<any[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentLineIndex >= logs.length) return;

        const timeout = setTimeout(() => {
            setLines((prev) => [...prev, logs[currentLineIndex]]);
            setCurrentLineIndex((prev) => prev + 1);
        }, logs[currentLineIndex].delay);

        return () => clearTimeout(timeout);
    }, [currentLineIndex]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <div className="w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-border/50 bg-[#0c0c0c] font-mono text-sm shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex items-center gap-2 ml-4 text-xs text-muted-foreground/80">
                    <Terminal className="h-3 w-3" />
                    <span>secure_shell.exe</span>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="h-64 overflow-y-auto p-4 space-y-2 scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {lines.map((line, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-2"
                        >
                            {line.type === "success" ? (
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            ) : (
                                <span className="text-blue-500 mt-0.5 shrink-0">➜</span>
                            )}
                            <span className={line.type === "success" ? "text-green-400" : "text-slate-300"}>
                                {line.text}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {currentLineIndex < logs.length && (
                    <div className="flex items-center gap-2 text-muted-foreground/50 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>processing...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
