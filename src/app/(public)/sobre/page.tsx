import { MapPin, Users2, Rocket } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-32 px-4 py-24">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">
          A Delta Rise.
        </h1>
        <p className="text-xl font-light leading-relaxed text-muted-foreground md:text-2xl">
          Nós existimos para resolver o hiato de tecnologia entre as operações físicas massivas e a gestão digital em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <SpotlightCard className="space-y-6 rounded-[2rem] border border-border bg-card/80 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Rocket className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Missão</h3>
          <p className="text-muted-foreground">
            Elevar a logística e a gestão de ativos físicos a padrões de tecnologia cloud-native.
          </p>
        </SpotlightCard>

        <SpotlightCard className="space-y-6 rounded-[2rem] border border-border bg-card/80 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
            <Users2 className="h-8 w-8 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Equipe</h3>
          <p className="text-muted-foreground">
            Engenheiros focados em performance, segurança e microinterações.
          </p>
        </SpotlightCard>

        <SpotlightCard className="space-y-6 rounded-[2rem] border border-border bg-card/80 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <MapPin className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Sede</h3>
          <p className="text-muted-foreground">
            Nascidos no Brasil, arquitetados para o mundo. Operação 100% remota e distribuída.
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
