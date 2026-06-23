"use client";

import { useEffect, useState } from "react";

export function GlobalSpotlight() {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div
            className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60 transition-[background] duration-300"
            style={{
                background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,165,0,0.06), transparent 40%)`,
            }}
        >
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
                style={{
                    maskImage: `radial-gradient(400px circle at ${position.x}px ${position.y}px, black, transparent)`
                }}
            />
        </div>
    );
}
