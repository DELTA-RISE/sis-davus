"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export function ParallaxShapes() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -500]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -90]);

    return (
        <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Circle 1 - Top Left */}
            <motion.div
                style={{ y: y1, rotate: rotate1 }}
                className="absolute top-[10%] left-[5%] w-64 h-64 border border-primary/20 rounded-full opacity-30 mix-blend-screen blur-xl"
            />

            {/* Circle 2 - Middle Right */}
            <motion.div
                style={{ y: y2, rotate: rotate2 }}
                className="absolute top-[40%] right-[10%] w-96 h-96 border border-chart-4/10 rounded-full opacity-20 mix-blend-screen blur-2xl"
            />

            {/* Circle 3 - Bottom Left */}
            <motion.div
                style={{ y: y3 }}
                className="absolute bottom-[20%] left-[15%] w-48 h-48 bg-chart-5/10 rounded-full opacity-30 mix-blend-screen blur-[80px]"
            />

            {/* Floating Square */}
            <motion.div
                style={{ y: y2, rotate: rotate1 }}
                className="absolute top-[25%] left-[45%] w-32 h-32 border border-purple-500/10 rotate-45 opacity-20"
            />
        </div>
    );
}
