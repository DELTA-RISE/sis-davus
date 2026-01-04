"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import "@/lib/fix-r3f-data-props"; // Apply Three.js patches for R3F compatibility

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useAuth } from "@/lib/auth-context";
import { DashboardDemo } from "@/components/DashboardDemo";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { NoiseOverlay } from "@/components/landing/NoiseOverlay";
import { ParallaxShapes } from "@/components/landing/ParallaxShapes";
// Dynamic imports handled above
import { MagneticButton } from "@/components/ui/magnetic-button";
import {
  Package,
  Building2,
  ArrowLeftRight,
  QrCode,
  Shield,
  Smartphone,
  ChevronRight,
  BarChart3,
  Users,
  Zap,
  LayoutDashboard,
  CheckCircle2,
  Globe,
  Database,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Controle de Estoque",
    description: "Gerencie produtos, quantidades e alertas de estoque baixo em tempo real.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Building2,
    title: "Gestão de Patrimônio",
    description: "Cadastre e monitore todos os bens da empresa com rastreamento completo.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ArrowLeftRight,
    title: "Movimentações",
    description: "Registre entradas, saídas e transferências com histórico detalhado.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: QrCode,
    title: "QR Code Integrado",
    description: "Identificação rápida de patrimônios através de leitura de QR Code via câmera.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Dashboards e relatórios para tomada de decisão estratégica.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Multi-usuários",
    description: "Controle de acesso com níveis de permissão personalizados.",
    color: "from-indigo-500 to-blue-500",
  },
];

const steps = [
  {
    title: "Cadastre seus Itens",
    description: "Adicione produtos ou ativos fixos com fotos, códigos e categorias.",
    icon: Database,
  },
  {
    title: "Gerencie em Tempo Real",
    description: "Realize movimentações, checkouts e inventários de qualquer lugar.",
    icon: ArrowLeftRight,
  },
  {
    title: "Analise Resultados",
    description: "Acompanhe métricas, custos e tendências em dashboards inteligentes.",
    icon: BarChart3,
  },
];

const stats = [
  { value: "100%", label: "Segurança de Dados" },
  { value: "Offline", label: "Suporte PWA" },
  { value: "Realtime", label: "Sincronização" },
  { value: "24/7", label: "Operação Contínua" },
];

const Hero3D = dynamic(() => import("@/components/landing/Hero3D").then(mod => mod.Hero3D), {
  ssr: false,
  loading: () => <div className="hidden ml-auto w-[600px] h-[600px] rounded-full bg-primary/5 animate-pulse lg:block" />
});
const BeforeAfterSlider = dynamic(() => import("@/components/landing/BeforeAfterSlider").then(mod => mod.BeforeAfterSlider), { ssr: false });
const InteractiveGlobe = dynamic(() => import("@/components/landing/InteractiveGlobe").then(mod => mod.InteractiveGlobe), { ssr: false });
const TypingTerminal = dynamic(() => import("@/components/landing/TypingTerminal").then(mod => mod.TypingTerminal), { ssr: false });

// Lazy load below-the-fold components
const StickyScrollGuide = dynamic(() => import("@/components/landing/StickyScrollGuide").then(mod => mod.StickyScrollGuide));
const MegaFooter = dynamic(() => import("@/components/landing/MegaFooter").then(mod => mod.MegaFooter));
const FAQSection = dynamic(() => import("@/components/landing/FAQ").then(mod => mod.FAQSection));
const RoiSimulator = dynamic(() => import("@/components/landing/RoiSimulator").then(mod => mod.RoiSimulator));
const TrustSection = dynamic(() => import("@/components/landing/TrustSection").then(mod => mod.TrustSection));
const InteractiveStat = dynamic(() => import("@/components/landing/InteractiveStat").then(mod => mod.InteractiveStat));

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // ... (rest of component code until return)

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <PWAInstallPrompt />

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-gradient-to-br from-primary/20 via-blue-600/10 to-transparent blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-3/4 h-3/4 bg-gradient-to-b from-chart-5/10 via-purple-500/10 to-transparent blur-[100px] rounded-full mix-blend-screen" />
      </div>
      <NoiseOverlay />
      <ParallaxShapes />
      <Hero3D />

      <LandingHeader />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-primary tracking-wide">SYSTEM V4.0</span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] hero-title uppercase"
            >
              <span className="block text-foreground">Gestão de</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600 animate-gradient-x bg-300%">
                Patrimônio
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed font-light tracking-wide"
            >
              Controle absoluto sobre ativos e estoque. A infraestrutura digital da <strong>Delta Rise</strong>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href={user ? "/dashboard" : "/login"}>
                <MagneticButton size="xl" className="h-14 px-10 text-lg rounded-full gap-3 shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                  {user ? "Acessar Dashboard" : "Acessar Sistema"}
                  <ChevronRight className="h-5 w-5" />
                </MagneticButton>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
                <Shield className="h-4 w-4 text-primary" />
                Acesso restrito a colaboradores
              </div>
            </motion.div>

            {/* Mock UI Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotateX: 10, perspective: 1000 }}
              animate={{
                opacity: 1,
                y: [0, -10, 0],
                rotateX: [10, 5, 10],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                opacity: { duration: 1, delay: 0.4 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              whileHover={{ rotateX: 0, scale: 1.02, transition: { duration: 0.5 } }}
              className="mt-20 relative max-w-5xl mx-auto cursor-default"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 overflow-hidden transition-all duration-500 hover:shadow-primary/20">
                <div className="rounded-xl overflow-hidden aspect-video bg-muted/5 flex items-center justify-center">
                  <DashboardDemo />
                </div>
              </div>
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -left-6 hidden md:block"
              >
                <div className="bg-card p-4 rounded-xl shadow-xl border border-border/50 flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Eficiência</p>
                    <p className="text-lg font-bold">+45%</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 hidden md:block"
              >
                <div className="bg-card p-4 rounded-xl shadow-xl border border-border/50 flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Smartphone className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Mobilidade</p>
                    <p className="text-lg font-bold">PWA</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-y border-border/40 bg-muted/30 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
            >
              {stats.map((stat, i) => (
                <InteractiveStat key={i} value={stat.value} label={stat.label} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Sticky Guide */}
        <StickyScrollGuide />

        {/* Before/After Slider Section */}
        <section className="py-24 bg-muted/10 border-y border-border/40">
          <BeforeAfterSlider />
        </section>

        {/* Marquee Section */}
        <div className="py-10 bg-background border-y border-border/40 overflow-hidden relative">
          <div className="flex gap-12 whitespace-nowrap animate-marquee">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-12 text-6xl md:text-8xl font-black text-foreground/5 uppercase tracking-tighter select-none">
                <span>Controle Total</span>
                <span>•</span>
                <span>Alta Performance</span>
                <span>•</span>
                <span>Segurança</span>
                <span>•</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        </div>

        {/* Features Bento Grid */}
        <section id="features" className="py-32 px-4 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Ferramentas de Gestão</h3>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Infraestrutura robusta para suporte às operações de campo e administrativas.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(250px,auto)]">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 0.98 }}
                  className={`relative group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm overflow-hidden flex flex-col justify-between
                    ${i === 0 || i === 3 ? 'md:col-span-2' : 'md:col-span-1'}
                    ${i === 0 ? 'bg-gradient-to-br from-card to-primary/5' : ''}
                  `}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-150 duration-500">
                    <feature.icon className="w-32 h-32 text-primary" />
                  </div>

                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/10 text-white relative z-10`}>
                    <feature.icon className="h-7 w-7" />
                  </div>

                  <div className="relative z-10">
                    <h4 className="font-bold text-xl mb-3">{feature.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PWA Section */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ rotateX: 2, rotateY: -2 }}
              viewport={{ once: true }}
              className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-12 md:p-20 shadow-2xl border border-primary/20 transform-gpu transition-transform duration-500"
              style={{ perspective: 1000 }}
            >
              <motion.div
                animate={{
                  rotate: [12, 15, 12],
                  y: [0, -10, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 p-8 opacity-10"
              >
                <Smartphone className="w-64 h-64 text-primary" />
              </motion.div>

              <div className="relative z-10 max-w-2xl">
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
                >
                  Acesso em Campo
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-slate-300 mb-10 leading-relaxed"
                >
                  O SIS DAVUS é um Progressive Web App (PWA). Instale no seu dispositivo móvel para realizar inventários e movimentações diretamente do depósito ou campo, com suporte total ao modo offline.
                </motion.p>

                <div className="flex flex-wrap gap-8">
                  {[
                    { icon: Globe, label: "Multi-plataforma" },
                    { icon: Smartphone, label: "Modo Offline" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Infra Structure Section with Globe and Terminal */}
        <section className="py-24 px-4 border-t border-border/40 bg-black/20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Operação Global & Segura</h3>
              <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative mb-8">
                <InteractiveGlobe />
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs border border-white/10">
                  Infraestrutura Global
                </div>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Criptografia Ponta-a-Ponta (AES-256)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Backup Redundante em 3 Regiões</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Monitoramento 24/7 SOC</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-6">
              <p className="text-lg text-muted-foreground">
                Nossos sistemas operam em uma malha de dados distribuída, garantindo integridade e disponibilidade total, onde quer que sua operação esteja.
              </p>
              <TypingTerminal />
            </div>
          </div>
        </section>

        {/* ROI Simulator */}
        <RoiSimulator />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <section className="py-32 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h3 className="text-4xl md:text-5xl font-bold mb-8">Pronto para otimizar nossa operação?</h3>
            <p className="text-xl text-muted-foreground mb-12">
              Padronizando a excelência operacional na Delta Rise. Simplicidade, controle e segurança.
            </p>
            <Link href={user ? "/dashboard" : "/login"}>
              <MagneticButton size="xl" className="h-16 px-12 text-xl rounded-full gap-3 shadow-2xl shadow-primary/40 transition-all hover:scale-105">
                {user ? "Acessar Painel" : "Acessar Sistema"}
                <ArrowLeftRight className="h-6 w-6" />
              </MagneticButton>
            </Link>
          </motion.div>
        </section>
      </main>

      <TrustSection />
      <MegaFooter />
    </div>
  );
}
