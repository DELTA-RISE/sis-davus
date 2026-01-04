"use client";

import { useScroll, useTransform, motion, useMotionValueEvent } from "framer-motion";
import { useRef } from "react";
import { Database, ArrowLeftRight, BarChart3, CheckCircle2 } from "lucide-react";
import { useScrollStore } from "@/lib/landing-store";

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
    const setScrollProgress = useScrollStore((state) => state.setScrollProgress);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"], // Modified offset for smoother transition
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setScrollProgress(latest);
    });

    return (
        <section ref={targetRef} className="relative z-10">
            {/* The scrollable height container */}
            <div className="relative">
                {steps.map((step, i) => (
                    <ScrollStep key={i} step={step} index={i} total={steps.length} />
                ))}
            </div>
        </section>
    );
}

function ScrollStep({ step, index, total }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ amount: 0.5, margin: "-10% 0px -10% 0px" }}
            className="h-screen w-full flex items-center justify-center p-6"
        >
            <div className="max-w-4xl w-full text-center space-y-8 backdrop-blur-sm bg-black/30 p-12 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className={`w-20 h-20 mx-auto rounded-3xl ${step.color}/20 flex items-center justify-center border border-white/10 mb-8`}>
                    <step.icon className={`w-10 h-10 ${step.color.replace('bg-', 'text-')}`} />
                </div>

                <h3 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
                    {step.title}
                </h3>

                <p className="text-xl md:text-3xl text-white/60 leading-relaxed max-w-2xl mx-auto">
                    {step.description}
                </p>

                <div className="pt-8 flex justify-center gap-2">
                    {Array.from({ length: total }).map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === index ? `w-12 ${step.color}` : 'w-3 bg-white/10'}`}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

