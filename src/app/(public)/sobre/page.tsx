import { MapPin, Users2, Rocket } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function SobrePage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-24 space-y-32">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                    A Delta Rise.
                </h1>
                <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-light">
                    Nós existimos para resolver o hiato de tecnologia entre as operações físicas massivas e a gestão digital em tempo real.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                        <Rocket className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Missão</h3>
                    <p className="text-white/60">Elevar a logística e a gestão de ativos físicos a padrões de tecnologia cloud-native.</p>
                </SpotlightCard>

                <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                        <Users2 className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Equipe</h3>
                    <p className="text-white/60">Engenheiros obcecados por performance, segurança militar e microinterações.</p>
                </SpotlightCard>

                <SpotlightCard className="p-8 rounded-[2rem] bg-black/40 border border-white/10 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                        <MapPin className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Sede</h3>
                    <p className="text-white/60">Nascidos no Brasil, arquitetados para o mundo. Operação 100% remota e distribuída.</p>
                </SpotlightCard>
            </div>
        </div>
    );
}
