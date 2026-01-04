"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        question: "O sistema funciona em áreas sem internet?",
        answer: "Sim. O SIS DAVUS utiliza tecnologia PWA (Progressive Web App) com arquitetura Offline-First. Seus operadores podem realizar movimentações de estoque, manutenções e checkouts sem conexão. Assim que o dispositivo detectar rede, tudo é sincronizado automaticamente com a base central, garantindo integridade de dados sem conflitos."
    },
    {
        question: "Como funciona a migração de dados legados?",
        answer: "Nossa equipe fornece ferramentas de importação em massa (CSV/Excel) e API aberta para integração direta. Durante o setup, auxiliamos no saneamento e estruturação dos dados para garantir que seu inventário comece organizado e padronizado nas categorias corretas."
    },
    {
        question: "É possível criar perfis de acesso customizados?",
        answer: "Absolutamente. O sistema possui controle de acesso baseado em cargos (RBAC). Você pode definir exatamente o que cada usuário pode ver ou editar, desde 'Apenas Visualização' até 'Administrador Global', passando por perfis específicos como 'Gestor de Manutenção' ou 'Operador de Almoxarifado'."
    },
    {
        question: "O sistema suporta múltiplos centros de custo?",
        answer: "Sim. A arquitetura foi desenhada para operações complexas. Você pode segregar estoques, ativos e despesas por Filial, Departamento ou Centro de Custo, permitindo relatórios financeiros detalhados e alocação precisa de recursos."
    }
];

export function FAQ() {
    return (
        <section className="py-32 px-4 relative z-10">
            <div className="max-w-3xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">Dúvidas Frequentes</h2>
                    <p className="text-white/60 text-xl">
                        Detalhes técnicos para decisores.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} faq={faq} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function AccordionItem({ faq, index }: { faq: any, index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "rounded-2xl border transition-all duration-300 overflow-hidden",
                isOpen ? "bg-white/10 border-white/20" : "bg-black/40 border-white/5 hover:border-white/10"
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
            >
                <span className={cn("text-lg font-medium transition-colors", isOpen ? "text-white" : "text-white/80")}>
                    {faq.question}
                </span>
                <div className={cn("p-2 rounded-full transition-colors", isOpen ? "bg-white/20 text-white" : "bg-white/5 text-white/40")}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-6 pb-6 text-white/60 leading-relaxed border-t border-white/5 pt-4">
                            {faq.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
