"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
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
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Controle de Estoque",
    description: "Gerencie produtos, quantidades e alertas de estoque baixo em tempo real",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Building2,
    title: "Gestão de Patrimônio",
    description: "Cadastre e monitore todos os bens da empresa com rastreamento completo",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ArrowLeftRight,
    title: "Movimentações",
    description: "Registre entradas, saídas e transferências com histórico detalhado",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: QrCode,
    title: "QR Code Integrado",
    description: "Identificação rápida de patrimônios através de leitura de QR Code",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Dashboards e relatórios para tomada de decisão estratégica",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Multi-usuários",
    description: "Controle de acesso com níveis de permissão personalizados",
    color: "from-indigo-500 to-blue-500",
  },
];

const stats = [
  { value: "100%", label: "Offline" },
  { value: "PWA", label: "Instalável" },
  { value: "24/7", label: "Disponível" },
  { value: "SSL", label: "Seguro" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <PWAInstallPrompt />
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-chart-5/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-chart-2/10 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 px-4 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-xl font-bold text-white">SD</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">SIS DAVUS</h1>
              <p className="text-[10px] text-muted-foreground">by Delta Rise</p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-1">
              Acessar
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="px-4 pt-12 pb-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div 
              className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <Zap className="h-3 w-3" />
                Sistema Interno de Gestão
              </span>
            </div>
            
            <h2 
              className={`text-4xl md:text-6xl font-bold mb-6 leading-tight transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              Controle total do seu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-chart-2 to-chart-5">
                Estoque e Patrimônio
              </span>
            </h2>
            
            <p 
              className={`text-lg text-muted-foreground mb-10 max-w-xl mx-auto transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              Simplifique a gestão de bens e produtos da sua empresa com um sistema completo, intuitivo e disponível em qualquer dispositivo.
            </p>
            
            <div 
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/30">
                  <Smartphone className="h-5 w-5" />
                  Acessar Sistema
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div 
              className={`grid grid-cols-4 gap-4 transition-all duration-700 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Recursos Completos</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Tudo que você precisa para gerenciar estoque e patrimônio em um único lugar
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className={`group p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${500 + i * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-chart-2/20 to-chart-5/20 p-8 md:p-12 border border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Instale como Aplicativo
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Adicione o SIS DAVUS à tela inicial do seu dispositivo e tenha acesso rápido ao sistema, mesmo offline.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Acesso seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>Carregamento rápido</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                    <span>Funciona offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-4 py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <span className="text-sm font-bold text-white">SD</span>
            </div>
            <div className="text-left">
              <p className="font-semibold">SIS DAVUS</p>
              <p className="text-xs text-muted-foreground">Sistema de Controle Interno</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Delta Rise. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
