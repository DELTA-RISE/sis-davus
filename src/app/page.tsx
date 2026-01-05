"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { m, LazyMotion, domAnimation, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Box, Shield, Zap, Globe, BarChart3, ChevronDown, Terminal } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useAuth } from "@/lib/auth-context";
import { TextMorph } from "@/components/landing/TextMorph";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

// Dynamic Imports for Heavy Components
const Experience = dynamic(() => import("@/components/landing/cinematic/Experience").then(mod => mod.Experience), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#030014] -z-10" />
});
const StickyScrollGuide = dynamic(() => import("@/components/landing/StickyScrollGuide").then(mod => mod.StickyScrollGuide));
const MegaFooter = dynamic(() => import("@/components/landing/MegaFooter").then(mod => mod.MegaFooter));
const ImpactMetrics = dynamic(() => import("@/components/landing/ImpactMetrics").then(mod => mod.ImpactMetrics));
const FAQ = dynamic(() => import("@/components/landing/FAQ").then(mod => mod.FAQ));
const SavingsCalculator = dynamic(() => import("@/components/landing/SavingsCalculator").then(mod => mod.SavingsCalculator));

export default function LandingPage() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const opacityHero = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const yHero = useTransform(scrollYProgress, [0, 0.1], [0, 100]);

  return (
    <LazyMotion features={domAnimation}>
      <div ref={containerRef} className="relative min-h-[400vh] bg-[#030014] overflow-hidden selection:bg-primary/30">

        {/* Gradient Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/10 blur-[100px]" />
        </div>

        {/* 3D Background Layer */}
        <Experience />

        {/* Content Layer */}
        <div className="relative z-10">
          <LandingHeader />

          {/* SECTION 1: HERO */}
          <section className="h-screen w-full flex flex-col items-center justify-center relative px-4 text-center">
            <m.div style={{ opacity: opacityHero, y: yHero }} className="space-y-8 max-w-4xl mx-auto backdrop-blur-sm p-8 rounded-3xl border border-white/5 bg-black/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-white/70 tracking-widest uppercase">System V4.0</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/40 leading-tight">
                <TextMorph text="ASSET" />
                <br />
                <span className="text-stroke-white text-transparent">MASTERY</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
                O controle absoluto sobre o físico e o digital.
                <br />
                <span className="text-white/40">Inventário. Rastreamento. Inteligência.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <Link href={user ? "/dashboard" : "/login"}>
                  <MagneticButton size="xl" className="h-16 px-12 text-lg rounded-full gap-3 bg-white text-black hover:bg-gray-200 transition-all border-none">
                    {user ? "Acessar Sistema" : "Começar Agora"}
                    <ArrowRight className="h-5 w-5" />
                  </MagneticButton>
                </Link>
              </div>
            </m.div>

            <m.div
              style={{ opacity: opacityHero }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30 animate-bounce"
            >
              <ChevronDown className="h-8 w-8" />
            </m.div>
          </section>



          {/* SECTION 1.5: THE ECOSYSTEM (CONNECTIVITY) */}
          <section className="min-h-[80vh] flex flex-col items-center justify-center py-20 px-4 relative z-20">
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="relative w-full h-[500px] border border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm overflow-hidden p-8 flex items-center justify-center">
                  {/* Mock Connectivity Visualization */}
                  <div className="absolute inset-0 bg-grid-white/[0.05]" />
                  <div className="relative z-10 flex items-center gap-4 md:gap-16 transform scale-90 md:scale-100">
                    {/* Phone */}
                    <div className="w-16 h-32 md:w-24 md:h-48 rounded-[1.5rem] md:rounded-[2rem] border-2 md:border-4 border-white/20 bg-black flex flex-col items-center justify-center relative shadow-2xl shadow-blue-500/20 shrink-0">
                      <div className="w-6 h-0.5 md:w-8 md:h-1 bg-white/20 rounded-full mb-2" />
                      <div className="space-y-1 md:space-y-2 w-full px-1.5 md:px-2">
                        <div className="h-1.5 md:h-2 w-full bg-white/10 rounded" />
                        <div className="h-1.5 md:h-2 w-2/3 bg-white/10 rounded" />
                        <div className="h-6 md:h-8 w-full bg-blue-500/20 rounded mt-2 md:mt-4 flex items-center justify-center">
                          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Connection Line */}
                    <div className="h-0.5 md:h-1 flex-1 bg-gradient-to-r from-blue-500/50 to-orange-500/50 relative min-w-[2rem]">
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white absolute top-1/2 -mt-[3px] md:-mt-1 animate-marquee" />
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="w-40 h-24 md:w-64 md:h-40 rounded-lg md:rounded-xl border-2 md:border-4 border-white/20 bg-black flex items-center justify-center relative shadow-2xl shadow-orange-500/20 shrink-0">
                      <div className="space-y-1 md:space-y-2 w-full px-2 md:px-4">
                        <div className="h-8 md:h-12 w-full bg-orange-500/10 rounded flex items-center px-2 gap-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500" />
                          <div className="h-0.5 md:h-1 w-1/2 bg-white/10 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-blue-400 font-mono text-sm uppercase tracking-widest">
                  <Globe className="h-4 w-4" />
                  <span>Global Sync</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  O Campo e a Base.<br />
                  Sincronizados.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  O que acontece no front de operação reflete instantaneamente no painel de gestão. Sem delays, sem planilhas intermediárias.
                </p>
                <ul className="space-y-4 pt-4">
                  {[
                    "Sincronização Bidirecional em < 100ms",
                    "Modo Offline Inteligente para áreas remotas",
                    "Notificações Push para alertas críticos"
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-white/70">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 2: VISIONARY FEATURES (BENTO) */}
          <section className="min-h-screen py-32 px-4 relative">
            <div className="max-w-7xl mx-auto space-y-24">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                  Arquitetura de Controle
                </h2>
                <p className="text-white/60 text-xl max-w-2xl mx-auto">
                  Uma suíte completa de ferramentas projetada para operações de alta complexidade.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
                {/* Feature 1 - Big Left */}
                <SpotlightCard className="md:col-span-2 md:row-span-2 rounded-[2rem] border-white/10 bg-black/40 backdrop-blur-xl p-10 flex flex-col justify-between group overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 border border-orange-500/30">
                      <Box className="h-7 w-7 text-orange-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Gestão de Estoque 3.0</h3>
                    <p className="text-white/60 text-lg leading-relaxed max-w-md">
                      Rastreamento em tempo real com níveis de estoque crítico, alertas automáticos e previsão de demanda baseada em histórico de consumo.
                    </p>
                    <ul className="mt-8 space-y-3">
                      {["Múltiplos Depósitos", "Curva ABC Automatizada", "Alertas Push"].map(item => (
                        <li key={item} className="flex items-center gap-2 text-white/50">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Abstract UI decoration */}
                  <div className="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] group-hover:bg-orange-500/20 transition-all duration-500" />
                </SpotlightCard>

                {/* Feature 2 - Top Right */}
                <SpotlightCard className="rounded-[2rem] border-white/10 bg-black/40 backdrop-blur-xl p-8 flex flex-col justify-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Globe className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Acesso Global</h3>
                  <p className="text-white/60">
                    Sincronização em tempo real entre filiais e operação de campo via PWA Offline-First.
                  </p>
                </SpotlightCard>

                {/* Feature 3 - Bottom Right */}
                <SpotlightCard className="rounded-[2rem] border-white/10 bg-black/40 backdrop-blur-xl p-8 flex flex-col justify-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Shield className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Segurança Militar</h3>
                  <p className="text-white/60">
                    Logs de auditoria imutáveis, controle de acesso RBAC e criptografia AES-256.
                  </p>
                </SpotlightCard>
              </div>
            </div>
          </section>

          {/* SECTION 2.5: STICKY SCROLL MORPH */}
          {/* SECTION 2.5: STICKY SCROLL MORPH */}
          <div className="relative z-10">
            <StickyScrollGuide />
          </div>

          {/* SECTION 3: IMPACT METRICS */}
          <ImpactMetrics />

          {/* SECTION: INDUSTRIES (Before CTA) */}
          <section className="py-24 px-4 bg-white/5 border-y border-white/5">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Projetado para Escala</h2>
                <p className="text-white/60 text-xl max-w-2xl mx-auto">Sua operação não pode parar. Nós garantimos que ela flua.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Construção Civil", desc: "Monitore ferramentas em canteiros de obras distribuídos.", icon: Box },
                  { title: "TI & Infraestrutura", desc: "Gerencie o ciclo de vida de milhares de dispositivos.", icon: Terminal },
                  { title: "Logística", desc: "Rastreio preciso de carga e estoque de transbordo.", icon: Globe }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-[2rem] bg-black/40 border border-white/10 hover:border-white/20 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION: THE VAULT (Before CTA) */}
          <section className="py-24 px-4 flex justify-center">
            <div className="max-w-4xl w-full text-center space-y-8">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
                <Shield className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white">Fortaleza Digital</h2>
              <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Seus dados são o ativo mais valioso. Nossa arquitetura garante que apenas olhos autorizados vejam o que importa.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm font-mono text-green-400/80">
                <span className="px-4 py-2 rounded-full bg-green-500/5 border border-green-500/10">AES-256 ENCRYPTION</span>
                <span className="px-4 py-2 rounded-full bg-green-500/5 border border-green-500/10">SOC-2 COMPLIANT</span>
                <span className="px-4 py-2 rounded-full bg-green-500/5 border border-green-500/10">IMMUTABLE LOGS</span>
              </div>
            </div>
          </section>

          {/* SECTION: SAVINGS CALCULATOR */}
          <SavingsCalculator />

          {/* SECTION: FAQ */}
          <FAQ />

          {/* SECTION 4: CTA */}
          <section className="min-h-[50vh] flex items-center justify-center py-20 bg-gradient-to-t from-black via-black to-transparent">
            <div className="text-center space-y-8 max-w-3xl mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Pronto para o Futuro?</h2>
              <p className="text-white/60 text-xl">Eleve o padrão de gestão da sua empresa hoje.</p>
              <Link href={user ? "/dashboard" : "/login"}>
                <MagneticButton size="xl" className="h-20 px-16 text-2xl rounded-full bg-primary hover:bg-primary/90 text-white border-0 shadow-lg shadow-primary/20">
                  Iniciar Jornada
                </MagneticButton>
              </Link>
            </div>
          </section>

          <MegaFooter />
        </div>
      </div >
    </LazyMotion >
  );
}
