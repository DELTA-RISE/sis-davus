"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
    {
        question: "O sistema funciona sem internet?",
        answer: "Sim! O SIS DAVUS é um PWA (Progressive Web App) com suporte completo a offline-first. Você pode realizar movimentações e consultas sem conexão, e o sistema sincroniza automaticamente quando a rede retornar."
    },
    {
        question: "Posso gerenciar múltiplas unidades/filiais?",
        answer: "Perfeitamente. A arquitetura foi desenhada para multi-tenancy e gestão de filiais, permitindo visão consolidada ou segregada por unidade de negócio."
    },
    {
        question: "Como funciona a leitura de QR Code?",
        answer: "Utilizamos a câmera do próprio dispositivo (celular ou tablet). Cada ativo recebe uma etiqueta única gerada pelo sistema, permitindo identificação instantânea e acesso ao histórico."
    },
    {
        question: "Existe limite de usuários?",
        answer: "Não. Nosso modelo de licenciamento Enterprise permite usuários ilimitados, com controle granular de permissões (RBAC) para garantir a segurança dos dados."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-32 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-20">
                    <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Dúvidas Frequentes</h3>
                    <p className="text-muted-foreground text-lg">Tudo o que você precisa saber sobre a implementação.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="border border-border/50 bg-card rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                            >
                                <span className="text-xl font-bold tracking-tight">{faq.question}</span>
                                <div className={`p-2 rounded-full transition-colors ${openIndex === i ? 'bg-primary text-white' : 'bg-muted'}`}>
                                    {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 md:px-8 pb-8 pt-0 text-muted-foreground leading-relaxed text-lg">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
