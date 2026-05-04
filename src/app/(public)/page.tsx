import Image from "next/image";
import Link from "next/link";
import {
  Apple,
  AppWindow,
  ArrowRight,
  Box,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileBarChart,
  Globe,
  LockKeyhole,
  MoreVertical,
  PackageCheck,
  Share2,
  Shield,
  Smartphone,
  Terminal,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  {
    title: "Gestão de Estoque 3.0",
    description:
      "Controle produtos, entradas, saídas, níveis críticos, múltiplos depósitos e alertas de reposição.",
    icon: Boxes,
    items: ["Múltiplos depósitos", "Curva ABC", "Alertas de estoque"],
  },
  {
    title: "Patrimônio",
    description:
      "Acompanhe ativos por código, localização, status, condição, manutenção e histórico de movimentações.",
    icon: Building2,
    items: ["Código do ativo", "Histórico completo", "Status operacional"],
  },
  {
    title: "Checkouts",
    description:
      "Registre retirada e devolução de itens para equipes de campo com rastreabilidade clara.",
    icon: ClipboardCheck,
    items: ["Retirada", "Devolução", "Responsável"],
  },
  {
    title: "Relatórios",
    description:
      "Visualize indicadores de estoque, patrimônio, manutenção e operação sem depender de planilhas paralelas.",
    icon: FileBarChart,
    items: ["Indicadores", "Filtros", "Exportação"],
  },
];

const syncItems = [
  "Sincronização entre campo e base",
  "Modo offline para áreas remotas",
  "Notificações para alertas críticos",
];

const securityItems = [
  "Controle de acesso por perfil",
  "Auditoria das principais ações",
  "Políticas de segurança no banco",
  "Dados protegidos no Supabase",
];

const industries = [
  {
    title: "Construção Civil",
    description: "Monitore ferramentas, equipamentos e materiais em obras distribuídas.",
    icon: Box,
  },
  {
    title: "TI e Infraestrutura",
    description: "Gerencie computadores, celulares, acessórios e ciclo de vida de dispositivos.",
    icon: Terminal,
  },
  {
    title: "Logística",
    description: "Acompanhe estoque operacional, movimentações e pontos de retirada.",
    icon: Globe,
  },
];

const metrics = [
  { label: "Módulos centrais", value: "4+" },
  { label: "Perfis de acesso", value: "2" },
  { label: "Fluxos operacionais", value: "10+" },
  { label: "Base web/PWA", value: "1" },
];

const faqs = [
  {
    question: "O sistema funciona apenas no escritório?",
    answer:
      "Não. A estrutura web/PWA permite uso em campo e no escritório, com fluxos preparados para conexão instável.",
  },
  {
    question: "Posso separar acesso por cargo?",
    answer:
      "Sim. O sistema trabalha com perfis como administrador e gestor, mantendo o acesso alinhado à responsabilidade de cada usuário.",
  },
  {
    question: "Preciso instalar aplicativo?",
    answer:
      "Não obrigatoriamente. A versão web funciona direto no navegador, e o PWA pode ser instalado pelo próprio Chrome ou Safari.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl grid-cols-1 items-center gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <Image
                src="/davus-logo.svg"
                alt="SIS DAVUS"
                width={48}
                height={48}
                priority
                className="h-12 w-12"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  SIS DAVUS
                </p>
                <p className="text-sm text-muted-foreground">
                  Patrimônio, estoque e operação
                </p>
              </div>
            </div>

            <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl md:text-6xl">
              Controle operacional completo, direto e leve para a Davus.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              Inventário, rastreamento, checkouts, relatórios, segurança e
              sincronização em uma experiência web objetiva para acompanhar a
              operação com clareza.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Acessar sistema
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex h-12 items-center justify-center rounded-md border border-border px-6 text-sm font-semibold hover:bg-muted"
              >
                Ver módulos
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <div
                  key={module.title}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <module.icon className="mb-4 h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-3">
              <PackageCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Campo e base sincronizados</h2>
            </div>
            <div className="grid gap-3">
              {syncItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-background p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Operação conectada
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              O que acontece na obra precisa aparecer rápido na gestão.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              O sistema organiza estoque, patrimônio e movimentações para evitar
              informação espalhada, retrabalho e perda de visibilidade entre
              equipes.
            </p>
            <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
              <WifiOff className="mt-1 h-5 w-5 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">
                Os fluxos foram pensados para uso real: escritório, campo,
                conexão oscilando e necessidade de resposta rápida.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Arquitetura de controle
          </p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
            Uma suíte completa para operações de alta complexidade.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {modules.map((module) => (
            <article key={module.title} className="rounded-lg border border-border bg-card p-5">
              <module.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {module.description}
              </p>
              <ul className="mt-5 space-y-2">
                {module.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-12 md:grid-cols-4 lg:px-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-border bg-background p-5">
              <p className="text-3xl font-semibold text-primary">{metric.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Projetado para escala</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Sua operação não pode parar. O sistema organiza os pontos críticos
            para facilitar decisão e acompanhamento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {industries.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-6">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-semibold md:text-4xl">Fortaleza digital</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              A gestão de patrimônio e estoque precisa de rastreabilidade,
              permissão correta e dados protegidos.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {securityItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
                <LockKeyhole className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Download className="h-4 w-4 text-primary" />
            Multi-platform
          </div>
          <h2 className="text-3xl font-semibold md:text-4xl">
            Disponível onde você estiver
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Use no navegador ou instale como PWA para acesso rápido nos
            dispositivos da equipe.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <AppWindow className="h-7 w-7 text-primary" />
            <h3 className="mt-5 text-2xl font-semibold">Desktop App</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A versão desktop nativa pode ser preparada depois. Hoje, a versão
              web entrega o acesso principal sem instalação pesada.
            </p>
            <Button disabled className="mt-6 w-full">
              Download indisponivel
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <Smartphone className="h-7 w-7 text-primary" />
            <h3 className="mt-5 text-2xl font-semibold">Mobile PWA</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Instale direto pelo navegador em celulares e tablets usados na
              operação.
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Apple className="h-5 w-5" />
                  iOS
                </div>
                <p className="text-sm text-muted-foreground">
                  Safari, Compartilhar <Share2 className="inline h-3 w-3" /> e
                  Adicionar à Tela de Início.
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <MoreVertical className="h-5 w-5" />
                  Android
                </div>
                <p className="text-sm text-muted-foreground">
                  Chrome, menu Mais e Instalar aplicativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            Perguntas frequentes
          </h2>
          <div className="mt-10 grid gap-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-border bg-background p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center lg:px-8">
        <h2 className="text-3xl font-semibold md:text-4xl">Pronto para operar?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Entre no sistema para acessar dashboard, estoque, patrimônio,
          checkouts, relatórios e administração.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Entrar no SIS DAVUS
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
