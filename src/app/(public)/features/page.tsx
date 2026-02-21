import { Box, Lock, Zap, RefreshCw } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function FeaturesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-24 space-y-24">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                    Features
                </h1>
                <p className="text-xl text-white/60 leading-relaxed">
                    Tudo que você precisa para dominar sua operação física e digital em um único ecossistema integrado.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FeatureCard
                    icon={Box}
                    title="Gestão de Estoque Avançada"
                    desc="Controle múltiplos depósitos, defina níveis críticos de curva ABC e faça inventários físicos com um clique usando o app mobile."
                />
                <FeatureCard
                    icon={RefreshCw}
                    title="Sync Bidirecional Offline"
                    desc="Seus operadores de campo continuam trabalhando mesmo sem internet. Assim que a conexão volta, o PWA sincroniza tudo silenciosamente."
                />
                <FeatureCard
                    icon={Lock}
                    title="Controle de Acesso RBAC"
                    desc="Defina permissões granulares. Quem pode aprovar compras? Quem pode apenas ver relatórios? Você tem o controle total em matrizes de acesso."
                />
                <FeatureCard
                    icon={Zap}
                    title="Automação de Alertas"
                    desc="Não seja pego de surpresa. O sistema avisa via Push ou Email quando o estoque chega próximo ao mínimo vital da operação."
                />
            </div>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-xl group">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-white/60 text-lg leading-relaxed">{desc}</p>
        </SpotlightCard>
    )
}
