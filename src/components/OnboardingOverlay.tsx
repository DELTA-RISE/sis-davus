"use client";

import React, { useEffect, useState, useRef } from "react";
import { useOnboarding, TourStep } from "@/lib/onboarding-context";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft, Sparkles, Rocket } from "lucide-react";

export function OnboardingOverlay() {
    const { isActive, currentStepIndex, steps, nextStep, prevStep, skipOnboarding, finishOnboarding } = useOnboarding();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = steps[currentStepIndex];

    // Update target position on resize or step change
    useEffect(() => {
        if (!isActive || !step) return;

        if (step.placement === "center") {
            setTargetRect(null); // No specific highlight for center modals
            return;
        }

        // Use ResizeObserver for cleaner size tracking
        const resizeObserver = new ResizeObserver(() => {
            updateRect();
        });

        const updateRect = () => {
            const element = document.getElementById(step.target);
            if (element) {
                // Only scroll if off screen (optional, but 'scrollIntoView' forces it)
                // Using 'auto' behavior to be synchronous and avoid timing issues
                // We only scroll ONCE when the step changes, not on every updateRect call
                const rect = element.getBoundingClientRect();

                // Add padding
                setTargetRect({
                    ...rect.toJSON(),
                    left: rect.left - 8,
                    top: rect.top - 8,
                    width: rect.width + 16,
                    height: rect.height + 16
                });
            }
        };

        const initStep = () => {
            const element = document.getElementById(step.target);
            if (element) {
                element.scrollIntoView({ behavior: "auto", block: "center" });
                updateRect();
                resizeObserver.observe(element);
            }
        };

        // Initial load
        // We use requestAnimationFrame to ensure DOM is painted
        requestAnimationFrame(() => {
            // Small delay to allow sidebar transitions etc
            setTimeout(initStep, 100);
        });

        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, { capture: true, passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, { capture: true });
        };
    }, [isActive, currentStepIndex, step]);

    if (!isActive || !step) return null;

    const isLastStep = currentStepIndex === steps.length - 1;
    const isCenter = step.placement === "center";

    return (
        <div className="fixed inset-0 z-[100] isolate pointer-events-none">
            {/* Backdrop with Hole (Spotlight effect) */}
            {!isCenter && targetRect && (
                <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            <motion.rect
                                initial={false}
                                animate={{
                                    x: targetRect.left,
                                    y: targetRect.top,
                                    width: targetRect.width,
                                    height: targetRect.height,
                                    rx: 12 // Rounded corners
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect
                        className="w-full h-full fill-black/60 backdrop-blur-[2px]"
                        mask="url(#spotlight-mask)"
                    />
                </svg>
            )}

            {/* Full Backdrop for Center Modal */}
            {isCenter && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                />
            )}

            {/* Tooltip / Modal Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        // Position calculation
                        ...(!isCenter && targetRect ? calculateTooltipPosition(targetRect, step.placement || "bottom") : {
                            top: "50%",
                            left: "50%",
                            x: "-50%",
                            y: "-50%"
                        })
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className={cn(
                        "absolute pointer-events-auto bg-card text-card-foreground p-6 rounded-2xl shadow-2xl border border-primary/20",
                        isCenter ? "w-full max-w-lg" : "w-[350px]"
                    )}
                    style={{
                        position: "absolute", // Override motion style if needed
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                {isCenter ? <Rocket className="w-5 h-5 text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />}
                            </div>
                            <h3 className="font-bold text-lg">{step.title}</h3>
                        </div>
                        {!isLastStep && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={skipOnboarding}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Body */}
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        {step.content}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        idx === currentStepIndex ? "bg-primary" : "bg-muted"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            {currentStepIndex > 0 && (
                                <Button variant="outline" size="sm" onClick={prevStep}>
                                    Voltar
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={nextStep}
                                className={cn(isLastStep && "bg-green-500 hover:bg-green-600")}
                            >
                                {isLastStep ? "Começar!" : "Próximo"}
                                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Helper to calculate tooltip position
function calculateTooltipPosition(target: { top: number, left: number, width: number, height: number }, placement: string) {
    const gap = 16;
    switch (placement) {
        case "top": return { top: target.top - gap, left: target.left + target.width / 2, x: "-50%", y: "-100%" };
        case "bottom": return { top: target.top + target.height + gap, left: target.left + target.width / 2, x: "-50%", y: "0%" };
        case "left": return { top: target.top + target.height / 2, left: target.left - gap, x: "-100%", y: "-50%" };
        case "right": return { top: target.top + target.height / 2, left: target.left + target.width + gap, x: "0%", y: "-50%" };
        default: return { top: target.top + target.height + gap, left: target.left, x: "0%", y: "0%" };
    }
}
