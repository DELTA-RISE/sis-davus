"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface InteractiveStatProps {
    value: string;
    label: string;
}

export function InteractiveStat({ value, label }: InteractiveStatProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [displayValue, setDisplayValue] = useState(value.replace(/\D/g, "").length > 0 ? "0" : value);

    // Match leading number and the rest as suffix (e.g., "100%" -> 100, "%" | "24/7" -> 24, "/7")
    const match = value.match(/^(\d+)(.*)$/);
    const hasNumbers = !!match;
    const numericValue = match ? parseInt(match[1]) : 0;
    const suffix = match ? match[2] : "";

    useEffect(() => {
        if (isInView && hasNumbers) {
            let start = 0;
            const duration = 2000;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = numericValue / steps;

            const timer = setInterval(() => {
                start += increment;
                if (start >= numericValue) {
                    start = numericValue;
                    clearInterval(timer);
                }
                setDisplayValue(Math.floor(start).toString());
            }, stepTime);

            return () => clearInterval(timer);
        } else if (isInView && !hasNumbers) {
            setDisplayValue(value);
        }
    }, [isInView, numericValue, hasNumbers, value]);

    const handleMouseEnter = () => {
        // Scramble effect
        const chars = hasNumbers ? "0123456789" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const targetValue = hasNumbers ? numericValue.toString() : value;
        let iterations = 0;

        const interval = setInterval(() => {
            setDisplayValue(
                targetValue
                    .split("")
                    .map((letter, index) => {
                        if (index < iterations) {
                            return targetValue[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("")
            );

            if (iterations >= targetValue.length) clearInterval(interval);
            iterations += 1 / 3;
        }, 30);

        // Reset to clean value after scramble
        setTimeout(() => {
            clearInterval(interval);
            setDisplayValue(targetValue);
        }, 1000);
    };

    return (
        <div
            ref={ref}
            className="text-center cursor-pointer group"
            onMouseEnter={handleMouseEnter}
        >
            <p className="text-4xl md:text-5xl font-black text-primary mb-2 tracking-tighter transition-all group-hover:scale-110 group-hover:text-chart-4">
                {displayValue}{hasNumbers ? suffix : ""}
            </p>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                {label}
            </p>
        </div>
    );
}
