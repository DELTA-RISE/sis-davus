"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";

interface MagneticButtonProps extends ButtonProps {
    children: React.ReactNode;
}

export function MagneticButton({ children, className, ...props }: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current!.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
        setTextPosition({ x: middleX * 0.1, y: middleY * 0.1 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
        setTextPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            style={{ position: "relative" }}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            <Button
                ref={ref}
                onMouseMove={handleMouseMove}
                onMouseLeave={reset}
                className={className}
                {...props}
            >
                <motion.span
                    style={{ position: "relative" }}
                    className="flex items-center justify-center gap-2 whitespace-nowrap"
                    animate={{ x: textPosition.x, y: textPosition.y }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.1 }}
                >
                    {children}
                </motion.span>
            </Button>
        </motion.div>
    );
}
