"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ScrollTextReveal({ text, className = "" }: { text: string; className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 85%", "start 40%"],
    });

    const words = text.split(" ");

    return (
        <div ref={containerRef} className={`flex flex-wrap gap-x-[0.3em] gap-y-1 ${className}`}>
            {words.map((word, i) => {
                const start = i / words.length;
                const end = start + 1 / words.length;
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);

                return (
                    <motion.span
                        key={i}
                        style={{ opacity }}
                        className="inline-block"
                    >
                        {word}
                    </motion.span>
                );
            })}
        </div>
    );
}
