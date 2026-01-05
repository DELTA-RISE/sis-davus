"use client";

import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

interface TextMorphProps {
    text: string;
    className?: string;
    trigger?: boolean;
}

export function TextMorph({ text, className = "", trigger = true }: TextMorphProps) {
    const [displayText, setDisplayText] = useState(text);
    const [isScrambling, setIsScrambling] = useState(false);

    useEffect(() => {
        if (!trigger) return;

        let iteration = 0;
        setIsScrambling(true);

        const interval = setInterval(() => {
            setDisplayText((prev) =>
                text
                    .split("")
                    .map((char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(interval);
                setIsScrambling(false);
            }

            iteration += 1 / 5; // Speed of reveal (Lower denominator = Faster)
        }, 30);

        return () => clearInterval(interval);
    }, [text, trigger]);

    return (
        <span className={`${className} ${isScrambling ? "font-mono" : ""}`}>
            {displayText}
        </span>
    );
}
