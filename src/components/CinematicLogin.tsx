"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CinematicLoginProps {
    onComplete: () => void;
    isLoading: boolean;
}

export function CinematicLogin({ onComplete, isLoading }: CinematicLoginProps) {
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        setShowOverlay(isLoading);
    }, [isLoading]);

    return (
        <AnimatePresence>
            {showOverlay && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-background flex items-center justify-center flex-col"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
                            <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-primary rounded-full animate-ping opacity-20" />
                            </div>
                        </div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl font-bold tracking-widest uppercase"
                        >
                            Autenticando
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-muted-foreground text-sm"
                        >
                            Estabelecendo conexão segura...
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
