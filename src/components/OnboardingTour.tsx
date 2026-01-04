"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function OnboardingTour() {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem("hasSeenTour");

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    {
                        element: '[data-tour="sidebar-trigger"]',
                        popover: {
                            title: "Menu Principal",
                            description: "Acesse todos os módulos do sistema por aqui. Passe o mouse para expandir.",
                            side: "right",
                            align: "start",
                        },
                    },
                    {
                        element: '[data-tour="command-palette"]',
                        popover: {
                            title: "Command Palette",
                            description: "Pressione Ctrl+K ou clique aqui para acessar qualquer coisa rapidamente.",
                            side: "bottom",
                            align: "center",
                        },
                    },
                    {
                        element: '[data-tour="zen-mode"]',
                        popover: {
                            title: "Modo Zen",
                            description: "Precisa de foco? Ative o modo tela cheia para trabalhar sem distrações.",
                            side: "bottom",
                            align: "end",
                        },
                    },
                ],
                onDestroyed: () => {
                    localStorage.setItem("hasSeenTour", "true");
                },
            });

            // Small delay to ensure elements are mounted
            setTimeout(() => {
                driverObj.drive();
            }, 1000);
        }
    }, []);

    return null;
}
