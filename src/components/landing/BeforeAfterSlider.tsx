"use client";

import { useState, useRef, useEffect } from "react";
import { MoveHorizontal, FileSpreadsheet, LayoutDashboard, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function BeforeAfterSlider() {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = "touches" in event ? event.touches[0].clientX : (event as any).clientX;
        const position = ((x - rect.left) / rect.width) * 100;

        setSliderPosition(Math.min(Math.max(position, 0), 100));
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleMove);
            window.addEventListener("touchend", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="text-center mb-10">
                <h3 className="text-3xl font-bold mb-4">Transformação Imediata</h3>
                <p className="text-muted-foreground">Veja a diferença entre o caos das planilhas e o controle do Sis Davus.</p>
            </div>

            <div
                ref={containerRef}
                className="relative h-[400px] w-full rounded-3xl overflow-hidden border border-border/50 shadow-2xl select-none group cursor-ew-resize"
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                {/* AFTER Image (Right Side - Dashboard) */}
                <div className="absolute inset-0 bg-background flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full p-8 bg-zinc-950 flex flex-col items-center justify-center">
                        {/* Mock Dashboard UI */}
                        <div className="w-full max-w-md space-y-4">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="text-primary h-6 w-6" />
                                    <span className="font-bold text-xl">Dashboard</span>
                                </div>
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Online
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-xs text-zinc-500 uppercase">Estoque Total</p>
                                    <p className="text-2xl font-bold text-white">12,450</p>
                                </div>
                                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-xs text-zinc-500 uppercase">Valor Atual</p>
                                    <p className="text-2xl font-bold text-green-500">R$ 2.4M</p>
                                </div>
                            </div>
                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 h-32 flex items-end justify-between gap-2">
                                {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                    <div key={i} style={{ height: `${h}%` }} className="w-full bg-primary/80 rounded-t-sm" />
                                ))}
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary border border-primary/20">
                            SIS DAVUS
                        </div>
                    </div>
                </div>

                {/* BEFORE Image (Left Side - Spreadsheets) - Clip Path controlled by slider */}
                <div
                    className="absolute inset-0 bg-white flex items-center justify-center overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <div className="w-full h-full p-8 bg-slate-100 flex flex-col items-center justify-center relative">
                        {/* Chaotic Spreadsheet UI */}
                        <div className="w-full max-w-md bg-white shadow-xl border border-slate-300 rounded-sm overflow-hidden text-[10px] text-slate-800 font-mono opacity-80 rotate-1 scale-105">
                            <div className="bg-green-700 text-white p-2 flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>Controle_Estoque_FINAL_v2_REVISADO.xlsx</span>
                            </div>
                            <div className="grid grid-cols-5 bg-slate-200 border-b border-slate-300 font-bold p-1">
                                <div>A</div><div>B</div><div>C</div><div>D</div><div>E</div>
                            </div>
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`grid grid-cols-5 p-1 border-b border-slate-100 ${i === 4 ? 'bg-red-100' : ''}`}>
                                    <div className="truncate">BR-{1000 + i}</div>
                                    <div className="truncate text-slate-500">Item {i + 1}</div>
                                    <div className="truncate">{Math.floor(Math.random() * 100)}</div>
                                    <div className={`truncate ${i === 4 ? 'text-red-600 font-bold' : ''}`}>{i === 4 ? 'ERRO' : 'OK'}</div>
                                    <div className="truncate text-slate-400">---</div>
                                </div>
                            ))}
                        </div>

                        {/* Error Popups */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute top-1/4 left-1/4 bg-white border border-slate-300 shadow-xl p-3 max-w-[150px] rounded flex items-center gap-2 z-10"
                        >
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-xs text-slate-800 font-bold">Erro de Fórmula! #REF!</span>
                        </motion.div>

                        <div className="absolute bottom-10 right-10 bg-black/10 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-300">
                            ANTIGAMENTE
                        </div>
                    </div>
                </div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-zinc-900 transition-transform group-hover:scale-110">
                        <MoveHorizontal className="h-5 w-5 text-zinc-900" />
                    </div>
                </div>
            </div>
        </div>
    );
}
