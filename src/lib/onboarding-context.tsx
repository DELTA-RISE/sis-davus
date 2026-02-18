"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

export interface TourStep {
    target: string; // ID of the element to highlight
    title: string;
    content: string | ReactNode;
    placement?: "top" | "bottom" | "left" | "right" | "center";
    showNextButton?: boolean;
    showPrevButton?: boolean;
    showSkip?: boolean;
    action?: () => void; // Callback when step activates (e.g., navigate to page)
}

interface OnboardingContextType {
    isActive: boolean;
    isDemoMode: boolean;
    currentStepIndex: number;
    steps: TourStep[];
    startOnboarding: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipOnboarding: () => void;
    finishOnboarding: () => void;
    toggleDemoMode: (enable?: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within an OnboardingProvider");
    }
    return context;
}

const ADMIN_STEPS: TourStep[] = [
    {
        target: "welcome-modal",
        title: "Bem-vindo ao SIS DAVUS",
        content: "Este é o seu centro de comando. Vamos fazer um tour rápido para você dominar o sistema.",
        placement: "center",
        showNextButton: true,
    },
    {
        target: "dashboard-kpi",
        title: "Visão Geral",
        content: "Acompanhe métricas vitais em tempo real. No modo Demo, esses números são simulados para mostrar o potencial do sistema.",
        placement: "bottom",
        action: () => { /* ensure on dashboard */ },
    },
    {
        target: "sidebar-users",
        title: "Gestão de Usuários",
        content: "Gerencie sua equipe, permissões e acessos nesta seção.",
        placement: "right",
    },
    {
        target: "header-notifications",
        title: "Notificações",
        content: "Fique por dentro de tudo: estoque baixo, manutenções pendentes e alertas do sistema.",
        placement: "bottom",
    },
    {
        target: "completion-modal",
        title: "Tudo Pronto!",
        content: "Você já sabe o básico. Agora é com você! O modo Demo continuará ativo para você explorar.",
        placement: "center",
    }
];

const MANAGER_STEPS: TourStep[] = [
    {
        target: "welcome-modal",
        title: "Bem-vindo, Gestor!",
        content: "Sua ferramenta completa para gestão de ativos e estoque está pronta.",
        placement: "center",
    },
    {
        target: "dashboard-kpi",
        title: "Indicadores Chave",
        content: "Monitore o valor total do patrimônio e itens críticos instantaneamente.",
        placement: "bottom",
    },
    {
        target: "sidebar-assets",
        title: "Patrimônio",
        content: "Cadastre, transfira e audite ativos da empresa com facilidade.",
        placement: "right",
        action: () => {
            // Just highlight the sidebar link
        }
    },
    {
        target: "assets-stats",
        title: "Gestão de Ativos",
        content: "Veja todos os detalhes dos seus bens, valores e status de manutenção aqui.",
        placement: "bottom",
        action: () => {
            // Auto-navigate needs to happen via context logic, but we can assume 'action' is called when step STARTS
            // The context effect will handle the routing if we implement it generic enough, 
            // OR we just use a 'route' property in TourStep (cleaner).
            // For now, let's keep it simple and use the side-effect in the Context.
        }
    },
    {
        target: "assets-new-btn",
        title: "Novo Patrimônio",
        content: "Adicione novos itens ao seu inventário rapidamente.",
        placement: "left",
    },
    {
        target: "sidebar-stock",
        title: "Estoque",
        content: "Controle de consumíveis, entradas e saídas. Nunca mais fique sem material.",
        placement: "right",
    },
    {
        target: "stock-stats",
        title: "Controle de Estoque",
        content: "Monitore níveis de estoque, ruptura e excessos em tempo real.",
        placement: "bottom",
    },
    {
        target: "completion-modal",
        title: "Vamos Começar!",
        content: "Explore o sistema com dados de exemplo e veja como ele pode transformar sua rotina.",
        placement: "center",
    }
];

export const MOBILE_STEPS: TourStep[] = [
    {
        target: 'center-modal', // Virtual ID for center placement
        title: "Bem-vindo ao Mobile!",
        content: (
            <div className="space-y-4">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Bem-vindo ao Mobile! 👋
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Sua gestão completa na palma da mão. Vamos fazer um tour rápido pela interface mobile?
                    </p>
                </div>
            </div>
        ),
        placement: 'center',
        showSkip: true,
    },
    {
        target: 'mobile-nav-tools',
        title: "Menu de Ferramentas",
        content: (
            <div className="space-y-2">
                <h3 className="font-semibold text-primary">Menu de Ferramentas</h3>
                <p className="text-sm text-muted-foreground">
                    Acesse Estoque, Patrimônio e Relatórios tocando aqui.
                </p>
            </div>
        ),
        placement: 'top',
    },
    {
        target: 'mobile-search-btn',
        title: "Busca Rápida",
        content: (
            <div className="space-y-2">
                <h3 className="font-semibold text-primary">Busca Rápida</h3>
                <p className="text-sm text-muted-foreground">
                    Encontre produtos e ativos instantaneamente.
                </p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: 'mobile-qr-btn',
        title: "Scanner QR",
        content: (
            <div className="space-y-2">
                <h3 className="font-semibold text-primary">Scanner QR</h3>
                <p className="text-sm text-muted-foreground">
                    Basta apontar a câmera para consultar itens.
                </p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: 'mobile-notif-btn',
        title: "Alertas",
        content: (
            <div className="space-y-2">
                <h3 className="font-semibold text-primary">Alertas</h3>
                <p className="text-sm text-muted-foreground">
                    Fique por dentro de tudo que acontece no sistema.
                </p>
            </div>
        ),
        placement: 'bottom',
    }
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { user, currentRole, isNewUser, updateProfileData } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();

    const [isActive, setIsActive] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState<TourStep[]>([]);

    // Load status from localStorage and set steps based on role/device
    useEffect(() => {
        if (!user) return;

        const hasOnboarded = localStorage.getItem(`sis_davus_onboarded_${user.id}`);

        // Select steps based on Role AND Device
        let selectedSteps: TourStep[] = MANAGER_STEPS; // Default

        if (isMobile) {
            selectedSteps = MOBILE_STEPS;
        } else if (currentRole === 'admin') {
            selectedSteps = ADMIN_STEPS;
        }
        setSteps(selectedSteps);

        // Auto-start if isNewUser is true AND on dashboard
        // We prioritize the database flag over localStorage for the initial "forced" flow
        if (isNewUser && pathname === "/dashboard" && !isActive) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                startOnboarding();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user, currentRole, isMobile, pathname, isNewUser, isActive]);

    // Handle Step Actions (Navigation)
    useEffect(() => {
        if (!isActive) return;
        const step = steps[currentStepIndex];
        if (step?.action) {
            step.action();
        }

        // Auto-Navigation Logic based on Target IDs
        // This is a simple heuristic: if target implies a page, go there.
        if (step?.target.includes("dashboard") && pathname !== "/dashboard") {
            router.push("/dashboard");
        } else if (step?.target.includes("assets") && !pathname.includes("/patrimonio") && !step.target.includes("sidebar")) {
            router.push("/patrimonio");
        } else if (step?.target.includes("stock") && !pathname.includes("/estoque") && !step.target.includes("sidebar")) {
            router.push("/estoque");
        }
    }, [currentStepIndex, isActive, steps, pathname, router]);


    const startOnboarding = () => {
        setIsActive(true);
        setIsDemoMode(true); // Default to demo mode for onboarding
        setCurrentStepIndex(0);
        // Ensure we start at dashboard
        router.push("/dashboard");
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            finishOnboarding();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const skipOnboarding = () => {
        finishOnboarding();
    };

    const finishOnboarding = async () => {
        setIsActive(false);
        setIsDemoMode(false); // Switch to real data
        if (user) {
            localStorage.setItem(`sis_davus_onboarded_${user.id}`, "true");

            // If user was new, mark as not new anymore
            if (isNewUser) {
                await updateProfileData({ is_new_user: false });
            }
        }
    };

    const toggleDemoMode = (enable?: boolean) => {
        setIsDemoMode(prev => enable ?? !prev);
    };

    return (
        <OnboardingContext.Provider
            value={{
                isActive,
                isDemoMode,
                currentStepIndex,
                steps,
                startOnboarding,
                nextStep,
                prevStep,
                skipOnboarding,
                finishOnboarding,
                toggleDemoMode,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}
