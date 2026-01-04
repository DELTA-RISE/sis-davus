"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";

export function RoiSimulator() {
    const [assetCount, setAssetCount] = useState([500]);
    const [assetValue, setAssetValue] = useState([2000]);
    const [annualLoss, setAnnualLoss] = useState([5]); // %

    const [savings, setSavings] = useState(0);

    useEffect(() => {
        const totalValue = assetCount[0] * assetValue[0];
        const lossAmount = totalValue * (annualLoss[0] / 100);
        const projectedSavings = lossAmount * 0.8; // Assuming 80% reduction
        setSavings(projectedSavings);
    }, [assetCount, assetValue, annualLoss]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <section className="py-24 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-top-left scale-110" />

            <div className="max-w-6xl mx-auto relative">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-4"
                    >
                        <Calculator className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">Simulador de Economia</span>
                    </motion.div>

                    <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                        Quanto você está <span className="text-primary">perdendo</span> hoje?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Calcule o retorno sobre o investimento imediato com o SIS DAVUS.
                        Nossa plataforma reduz em média 80% das perdas por extravio e depreciação não planejada.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                    {/* Controls */}
                    <div className="space-y-10 bg-card/50 p-8 rounded-3xl border border-border/50 backdrop-blur-sm">

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Número de Ativos</label>
                                <span className="text-2xl font-bold font-mono text-foreground">{assetCount[0].toLocaleString()}</span>
                            </div>
                            <Slider
                                value={assetCount}
                                onValueChange={setAssetCount}
                                max={5000}
                                step={50}
                                className="py-4"
                            />
                            <p className="text-xs text-muted-foreground">Quantidade total de equipamentos e bens duráveis.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Valor Médio (Unitário)</label>
                                <span className="text-2xl font-bold font-mono text-foreground">{formatCurrency(assetValue[0])}</span>
                            </div>
                            <Slider
                                value={assetValue}
                                onValueChange={setAssetValue}
                                max={10000}
                                step={100}
                                className="py-4"
                            />
                            <p className="text-xs text-muted-foreground">Valor estimado de cada item no inventário.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Perda Anual Estimada</label>
                                <span className="text-2xl font-bold font-mono text-destructive">{annualLoss[0]}%</span>
                            </div>
                            <Slider
                                value={annualLoss}
                                onValueChange={setAnnualLoss}
                                max={20}
                                step={0.5}
                                className="py-4"
                            />
                            <p className="text-xs text-muted-foreground">Porcentagem do inventário perdida, roubada ou danificada anualmente.</p>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-chart-4/20 rounded-full blur-3xl opacity-50 animate-pulse-slow" />

                        <div className="relative bg-card rounded-3xl p-8 border border-border shadow-2xl text-center overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-white/5 opacity-20" />

                            <h3 className="text-lg font-medium text-muted-foreground mb-2">Economia Anual Projetada</h3>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-chart-4 to-primary tracking-tighter">
                                    {formatCurrency(savings)}
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-chart-4/10 border border-chart-4/20 text-chart-4 font-bold text-sm mb-6">
                                <TrendingUp className="w-4 h-4" />
                                <span>ROI Estimado: {((savings / (assetCount[0] * 12)) * 100).toFixed(0)}% no primeiro ano</span>
                            </div>

                            <ul className="text-left space-y-3 text-sm text-muted-foreground max-w-xs mx-auto">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Redução de compras desnecessárias
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Fim do extravio de equipamentos
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Maior vida útil dos ativos
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
