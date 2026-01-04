"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { Database, ArrowLeftRight, BarChart3, CheckCircle2 } from "lucide-react";

const steps = [
    {
        title: "Centralização de Dados",
        description: "Abandone as planilhas. Cadastre todos os ativos e estoques em uma base única, segura e acessível de qualquer lugar.",
        icon: Database,
        color: "bg-blue-500",
    },
    {
        title: "Operação em Campo",
        description: "Movimentações reais. Sua equipe usa o app (PWA) para registrar entradas e saídas no momento em que elas acontecem.",
        icon: ArrowLeftRight,
        color: "bg-green-500",
    },
    {
        title: "Inteligência Decisiva",
        description: "Dashboards automáticos. Visualize custos, perdas e tendências sem precisar gastar horas compilando relatórios.",
        icon: BarChart3,
        color: "bg-orange-500",
    },
];

export function StickyScrollGuide() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"],
    });

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-background">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                <div className="max-w-7xl mx-auto w-full px-4 grid md:grid-cols-2 gap-20 items-center">

                    {/* Left: Text Content */}
                    <div className="relative z-10">
                        <h3 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">
                            Como funciona <br />
                            <span className="text-muted-foreground/50">o ecossistema.</span>
                        </h3>

                        <div className="space-y-24 relative">
                            {/* Global Orange Line - Continuous but masked by circles */}
                            {/* We keep the global orange line because animating segments smoothly is hard. */}
                            {/* But we REMOVE the global GRAY line to strictly honor the "no line inside" rule. */}
                            <motion.div
                                style={{ scaleY: scrollYProgress }}
                                className="absolute left-16 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-primary origin-top -z-10"
                            />

                            {steps.map((step, i) => {
                                const start = i / steps.length;
                                const end = (i + 1) / steps.length;

                                return (
                                    <StepCard
                                        key={i}
                                        step={step}
                                        index={i}
                                        progress={scrollYProgress}
                                        start={start}
                                        end={end}
                                        isFirst={i === 0}
                                        isLast={i === steps.length - 1} // Actually simpler now
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Visuals */}
                    <div className="hidden md:flex items-center justify-center relative h-[600px] w-full bg-muted/10 rounded-[2.5rem] border border-border/50 overflow-hidden">
                        {steps.map((step, i) => {
                            const opacity = useTransform(
                                scrollYProgress,
                                [i / steps.length, (i + 0.5) / steps.length, (i + 1) / steps.length],
                                [0, 1, 0]
                            );

                            return (
                                <motion.div
                                    key={i}
                                    style={{ opacity }}
                                    className="absolute inset-0 flex items-center justify-center p-12"
                                >
                                    <div className={`w-full h-full rounded-3xl ${step.color}/10 flex flex-col items-center justify-center gap-8 border border-border/50 shadow-2xl`}>
                                        <div className={`w-32 h-32 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>
                                            <step.icon className="text-white w-16 h-16" />
                                        </div>
                                        <div className="text-center p-8">
                                            <div className="text-9xl font-black opacity-5">{i + 1}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

function StepCard({ step, index, progress, start, end, isFirst, isLast }: any) {
    const opacity = useTransform(progress, [start, start + 0.2, end - 0.2, end], [0.5, 1, 1, 0.5]);

    // Trigger points for circle animation
    const triggerStart = start + 0.05;
    const triggerEnd = triggerStart + 0.15;

    const circleBorderProgress = useTransform(progress, [triggerStart, triggerEnd], [0, 1]);

    const iconColor = useTransform(
        progress,
        [triggerStart, triggerEnd],
        ["hsl(var(--muted-foreground))", "hsl(var(--primary-foreground))"]
    );

    return (
        <motion.div
            style={{ opacity }}
            className="flex gap-8 items-start pl-8 relative z-20 group"
        >
            {/* 
                Local Gray Connectors (Static Track)
                These replace the global gray line to guarantee NO crossover in the circle.
                They extend far enough to overlap in the gap.
             */}
            {!isFirst && (
                <div className="absolute left-16 -translate-x-1/2 -top-24 bottom-1/2 w-[2px] bg-border/50 -z-20" />
            )}
            {!isLast && (
                <div className="absolute left-16 -translate-x-1/2 top-1/2 h-32 w-[2px] bg-border/50 -z-20" />
            )}

            {/* The Circle with SVG Border */}
            <div className="relative w-16 h-16 shrink-0 z-20">
                {/* 
                   Base Masking Circle 
                   - Opaque background hides the passing global orange line.
                   - We do NOT put a border here, so the 'split' is purely the SVG animating.
                   - Or we put a subtle dark border to define the shape before animation.
                */}
                <div
                    className="absolute inset-0 rounded-full bg-background border-4 border-muted/20 flex items-center justify-center z-10 box-border"
                >
                    <motion.span
                        style={{ color: iconColor }}
                        className="font-bold text-xl relative z-20"
                    >
                        {index + 1}
                    </motion.span>
                </div>

                {/* SVG splitting path - animates ON TOP of the base mask */}
                <svg className="absolute inset-0 w-full h-full overflow-visible z-20 pointer-events-none" viewBox="0 0 64 64">
                    <motion.path
                        d="M 32,2 A 30,30 0 0,0 32,62"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        style={{ pathLength: circleBorderProgress }}
                    />
                    <motion.path
                        d="M 32,2 A 30,30 0 0,1 32,62"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        style={{ pathLength: circleBorderProgress }}
                    />
                </svg>
            </div>

            {/* Text Content */}
            <div className="pt-2">
                <h4 className="text-2xl font-bold mb-3">{step.title}</h4>
                <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
            </div>
        </motion.div>
    )
}
