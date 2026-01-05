"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";

export function SavingsCalculator() {
    const [assets, setAssets] = useState(500);
    const [avgValue, setAvgValue] = useState(2500);
    const [lossRate, setLossRate] = useState(5); // %

    // Calculations
    const totalAssetValue = useMemo(() => assets * avgValue, [assets, avgValue]);
    const currentAnnualLoss = useMemo(() => totalAssetValue * (lossRate / 100), [totalAssetValue, lossRate]);
    // Assume SIS DAVUS reduces loss by 90%
    const projectedSavings = useMemo(() => currentAnnualLoss * 0.90, [currentAnnualLoss]);

    return (
        <section className="py-32 px-4 relative z-10 bg-gradient-to-b from-black/0 to-primary/5">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Text & Pitch */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest">
                            <Calculator className="w-3 h-3" />
                            ROI Calculator
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Quanto o "descontrole" custa para você?
                        </h2>
                        <p className="text-white/60 text-lg leading-relaxed">
                            Pequenas perdas invisíveis somadas ao longo de um ano criam um rombo financeiro gigante. Descubra quanto você pode recuperar com gestão eficiente.
                        </p>

                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                            <p className="text-sm text-white/40 uppercase tracking-widest">Economia Projetada (Anual)</p>
                            <motion.p
                                key={projectedSavings}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl md:text-6xl font-black text-primary tracking-tighter"
                            >
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectedSavings)}
                            </motion.p>
                            <p className="text-sm text-green-400 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" />
                                Baseado em redução de 90% nas perdas
                            </p>
                        </div>
                    </div>

                    {/* Right: Interactive Controls */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl space-y-8">

                        {/* INPUT 1: ASSETS */}
                        <div className="space-y-4">
                            <div className="flex justify-between text-white">
                                <label className="font-bold">Total de Ativos</label>
                                <span className="font-mono text-primary">{assets} un</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="10000"
                                step="100"
                                value={assets}
                                onChange={(e) => setAssets(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                            />
                        </div>

                        {/* INPUT 2: AVG VALUE */}
                        <div className="space-y-4">
                            <div className="flex justify-between text-white">
                                <label className="font-bold">Valor Médio por Ativo</label>
                                <span className="font-mono text-primary">R$ {avgValue}</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="10000"
                                step="100"
                                value={avgValue}
                                onChange={(e) => setAvgValue(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                            />
                        </div>

                        {/* INPUT 3: LOSS RATE */}
                        <div className="space-y-4">
                            <div className="flex justify-between text-white">
                                <label className="font-bold">Taxa de Perda Anual Estimada</label>
                                <span className="font-mono text-red-400">{lossRate}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="0.5"
                                value={lossRate}
                                onChange={(e) => setLossRate(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
                            />
                            <p className="text-xs text-white/30 text-right">Média de mercado: 3% a 7%</p>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <MagneticButton className="w-full py-4 text-center justify-center bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-colors">
                                Quero Parar de Perder Dinheiro
                            </MagneticButton>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    );
}
