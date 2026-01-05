"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { m, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { AudioToggle } from "@/components/ui/audio-toggle";
import { LocalizedGreeting } from "@/components/landing/LocalizedGreeting";
import { useAuth } from "@/lib/auth-context";

export function LandingHeader() {
    const { user, userName } = useAuth();
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        // Only hide if we are scrolling DOWN and are past the top threshold
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else if (latest < previous || latest < 150) {
            // Show if scrolling UP or near top
            setHidden(false);
        }
    });

    return (
        <m.header
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/20 backdrop-blur-md supports-[backdrop-filter]:bg-black/20"
        >
            <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
                <m.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Image src="/davus-logo.svg" alt="Logo" width={28} height={28} className="w-7 h-7 brightness-0 invert" priority />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-base font-bold tracking-tight">SIS DAVUS</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Delta Rise</p>
                    </div>
                </m.div>

                {/* Centered Greeting - Only for authenticated users */}
                {user && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <LocalizedGreeting name={userName} />
                    </div>
                )}

                <m.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <AudioToggle />
                    <Link href={user ? "/dashboard" : "/login"}>
                        <MagneticButton size="sm" className="rounded-full px-6 transition-all hover:shadow-lg hover:shadow-primary/25">
                            {user ? "Acessar Dashboard" : "Entrar"}
                        </MagneticButton>
                    </Link>
                </m.div>
            </nav>
        </m.header>
    );
}
