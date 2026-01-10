# 20. Roadmap e Visão de Futuro

Planejamento estratégico para evolução do produto pós-entrega v1.0.

## 1. Dívida Técnica Conhecida

Items que foram postergados para garantir a entrega do MVP:

- **Refatoração do Sync**: Implementar `Mermaid` ou estrutura de árvore para resolução de conflitos mais inteligente do que "Last Write Wins".
- **i18n**: Internacionalização (Suporte a Inglês/Espanhol) não implementada hardcoded strings.
- **Testes Unitários**: Cobertura baixa de testes unitários (foco foi em E2E).

## 2. Roadmap: Próximas Funcionalidades (v1.1+)

### Q2 2026 - Módulo Contábil
- Cálculo automático de depreciação linear.
- Relatórios de valor residual de ativos.

### Q3 2026 - App Mobile Nativo
- Desenvolvimento de versões React Native para Android/iOS (substituindo o uso de PWA em coletores dedicados).
- Leitura de Códigos de Barras via Câmera Nativa otimizada.

### Q4 2026 - Integrações
- Webhook API para integração com ERPs (SAP, Totvs).
- Login via SSO (Active Directory / Keycloak) Enterprise.

## 3. Conclusão

O SisDavus v1.0 estabelece uma fundação sólida, segura e offline-first para a gestão patrimonial. A arquitetura modular permite que estas expansões futuras ocorram com mínimo impacto no núcleo estável do sistema.

---
**Fim da Documentação de Engenharia.**
