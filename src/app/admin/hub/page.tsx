"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  MapPin,
  FileText,
  Shield,
  Settings,
  Database,
  Activity,
  ChevronRight,
} from "lucide-react";

const adminItems = [
  { 
    href: "/admin/usuarios", 
    icon: Users, 
    label: "Gestão de Usuários", 
    description: "Adicionar, editar e gerenciar acessos",
    color: "bg-blue-500/20 text-blue-500"
  },
  { 
    href: "/admin/centros-custo", 
    icon: Briefcase, 
    label: "Centros de Custo", 
    description: "Gerenciar centros de custo e orçamentos",
    color: "bg-green-500/20 text-green-500"
  },
  { 
    href: "/admin/locais", 
    icon: MapPin, 
    label: "Locais de Armazenamento", 
    description: "Configurar locais e capacidades",
    color: "bg-amber-500/20 text-amber-500"
  },
  { 
    href: "/admin/logs", 
    icon: FileText, 
    label: "Logs de Auditoria", 
    description: "Visualizar histórico de ações",
    color: "bg-purple-500/20 text-purple-500"
  },
];

const systemItems = [
  { 
    icon: Settings, 
    label: "Configurações do Sistema", 
    description: "Preferências gerais do sistema",
    color: "bg-muted"
  },
  { 
    icon: Database, 
    label: "Backup de Dados", 
    description: "Gerenciar backups e restauração",
    color: "bg-muted"
  },
  { 
    icon: Activity, 
    label: "Monitoramento", 
    description: "Status e performance do sistema",
    color: "bg-muted"
  },
];

export default function AdminHubPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Hub de Administração</h1>
              <p className="text-sm text-muted-foreground">Gerencie o sistema</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Gerenciamento
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {adminItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors h-full">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Sistema
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {systemItems.map((item, index) => (
              <Card key={index} className="border-border/50 bg-card/50 opacity-60">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
                      Em breve
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}