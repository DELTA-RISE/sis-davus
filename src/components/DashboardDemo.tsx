"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Package,
  ArrowLeftRight,
  Users,
  Search,
  Bell,
  Menu,
  MoreVertical,
  Plus
} from "lucide-react";

export function DashboardDemo() {
  return (
    <div className="relative group">
      {/* Glow Effect behind */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-chart-4/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500" />

      {/* Glass Container */}
      <div className="relative w-full h-full bg-background/60 backdrop-blur-xl rounded-xl overflow-hidden flex flex-col shadow-2xl border border-white/10 ring-1 ring-black/5">
        {/* Top Bar */}
        <div className="h-12 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Menu className="h-4 w-4 text-muted-foreground" />
            <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-16 md:w-48 border-r border-border/50 bg-card/30 hidden sm:flex flex-col p-3 gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-full bg-muted/50 rounded-lg animate-pulse flex items-center gap-2 px-2">
                <div className="h-4 w-4 rounded bg-muted-foreground/20" />
                <div className="h-2 flex-1 bg-muted-foreground/10 rounded hidden md:block" />
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden bg-muted/5">
            <div className="flex flex-col gap-6 h-full">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Dashboard Geral</h3>
                  <p className="text-xs text-muted-foreground">Bem-vindo ao SIS DAVUS</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <Plus className="h-3 w-3 text-primary mr-1" />
                    <span className="text-[10px] font-bold text-primary uppercase">Novo</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Estoque", value: "1,284", icon: Package, color: "text-chart-5" },
                  { label: "Ativos", value: "452", icon: BarChart3, color: "text-chart-4" },
                  { label: "Saídas", value: "24", icon: ArrowLeftRight, color: "text-primary" },
                  { label: "Equipe", value: "12", icon: Users, color: "text-chart-2" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    className="bg-card p-3 rounded-xl border border-border/50 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <MoreVertical className="h-3 w-3 text-muted-foreground/30" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Content Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="md:col-span-2 bg-card rounded-xl border border-border/50 p-4 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Últimas Movimentações</span>
                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                      <Search className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Item #00{i}2</p>
                            <p className="text-[10px] text-muted-foreground">Saída - Unidade Norte</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold">Hoje, 10:45</p>
                          <p className="text-[10px] text-green-500">Concluído</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm flex flex-col gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alertas de Estoque</span>
                  <div className="flex-1 flex flex-col gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary">CRÍTICO</span>
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        </div>
                        <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                          <div className="h-full w-1/4 bg-primary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Cimento CP-II - 15 un. restando</p>
                      </div>
                    ))}
                    <div className="mt-auto pt-4 flex justify-center">
                      <div className="h-20 w-20 rounded-full border-4 border-muted flex items-center justify-center relative">
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent -rotate-45" />
                        <span className="text-xs font-black text-primary">84%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
