"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-primary/30">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
            />

            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center max-w-2xl px-8 py-14 backdrop-blur-xl bg-background/40 border border-white/10 dark:border-white/5 rounded-[2.5rem] shadow-2xl"
            >
                <motion.div
                    animate={{
                        y: [0, -12, 0],
                        rotateZ: [0, -5, 0, 5, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <SearchX className="w-32 h-32 text-primary relative z-10 drop-shadow-[0_0_20px_rgba(255,93,56,0.4)]" strokeWidth={1} />
                </motion.div>

                <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/40 mb-2 drop-shadow-sm leading-none">
                    404
                </h1>

                <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground/90 tracking-tight">
                    Página não encontrada
                </h2>

                <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">
                    Parece que o item ou a página que você está procurando sumiu do nosso estoque físico e digital.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                        onClick={() => router.back()}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 font-medium text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/50 rounded-2xl transition-all duration-300 ease-out overflow-hidden hover:shadow-lg backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        <span className="relative">Voltar</span>
                    </button>

                    <Link href="/dashboard" passHref>
                        <button className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-white bg-primary rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,93,56,0.35)] active:scale-[0.98]">
                            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-64 group-hover:h-56 opacity-10" />
                            <Home className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Ir para o Início</span>
                        </button>
                    </Link>
                </div>
            </motion.div>

            {/* Floating Elements */}
            <FloatingElements />
        </div>
    );
}

function FloatingElements() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Client-side only rendering handles hydration safely because of the parent's `if (!mounted)` */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        background: i % 2 === 0 ? 'currentColor' : 'var(--primary)',
                        width: Math.random() * 4 + 2 + 'px',
                        height: Math.random() * 4 + 2 + 'px',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: 0.1,
                        color: 'inherit'
                    }}
                    animate={{
                        y: [0, Math.random() * -100 - 50],
                        opacity: [0, Math.random() * 0.5 + 0.1, 0],
                        scale: [0, Math.random() * 1.5 + 0.5, 0]
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}
