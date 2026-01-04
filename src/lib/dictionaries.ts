export const dictionaries = {
    pt: {
        common: {
            welcome: "Bem-vindo",
            security: "Segurança",
            compliance: "Conformidade",
        },
        security: {
            title: "Arquitetura de Segurança",
            description: "Visão técnica detalhada sobre como protegemos seus dados.",
        }
    },
    en: {
        common: {
            welcome: "Welcome",
            security: "Security",
            compliance: "Compliance",
        },
        security: {
            title: "Security Architecture",
            description: "Detailed technical view on how we protect your data.",
        }
    }
};

export type Locale = keyof typeof dictionaries;
export const getDictionary = (locale: Locale) => dictionaries[locale];
