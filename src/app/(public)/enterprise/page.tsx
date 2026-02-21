import { Building2, PhoneCall } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import Link from "next/link";

export default function EnterprisePage() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-32 space-y-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold tracking-wide uppercase">
                        Para Operações Massivas
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 leading-tight">
                        Escala sem <br />Limites.
                    </h1>
                    <p className="text-xl text-white/60 leading-relaxed max-w-lg">
                        A infraestrutura Enterprise do Davus é separada. Tenants dedicados (Single-tenant), integrações via APIs Customizadas, SSO, ERP Connectors e SLA garantido de 99.99%.
                    </p>

                    <div className="flex gap-4 pt-4">
                        <Link href="/contato">
                            <MagneticButton size="xl" className="h-16 px-8 rounded-2xl bg-white text-black font-semibold gap-2 border-0">
                                <PhoneCall className="w-5 h-5" />
                                Falar com Vendas
                            </MagneticButton>
                        </Link>
                    </div>
                </div>

                <div className="relative">
                    <div className="relative w-full aspect-square md:aspect-video lg:aspect-square bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                        <div className="w-40 h-40 bg-orange-500/10 rounded-full blur-[80px] absolute" />
                        <Building2 className="w-32 h-32 text-white/10 relative z-10" strokeWidth={1} />
                    </div>
                </div>
            </div>
        </div>
    );
}
