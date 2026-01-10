# 01. Visão e Escopo do Projeto

**Identificação do Projeto**: SisDavus - Sistema de Gestão Inteligente de Ativos e Estoque
**Versão do Documento**: 1.0.0
**Status**: Versão Preliminar para Engenharia

---

## 1. Introdução

### 1.1 Propósito
O SisDavus é uma solução de software projetada para resolver a ineficiência no controle de ativos tangíveis e estoques de consumo em ambientes corporativos que sofrem com instabilidade de conexão internet. O sistema visa centralizar, rastrear e auditar o ciclo de vida de ativos e materiais, desde a aquisição até o descarte ou consumo.

### 1.2 Problema
Muitas organizações ainda utilizam planilhas descentralizadas ou sistemas legados que exigem conexão constante ("Always Online"). Isso gera:
- Descompasso entre estoque físico e sistêmico (Shadow IT).
- Falta de rastreabilidade sobre "quem está com o que".
- Interrupção de processos críticos durante falhas de rede.

### 1.3 Objetivos do Negócio
- **Reduzir perdas de ativos** em 30% através de rastreamento de alocação (Checkouts).
- **Eliminar paradas operacionais** causadas por falta de sistema (Estratégia Offline-First).
- **Prover auditoria completa** de todas as operações sensíveis (Logs de Segurança).

---

## 2. Partes Interessadas (Stakeholders)

| Papel | Descrição | Responsabilidades |
| :--- | :--- | :--- |
| **Gestor de TI** | Administrador do Sistema | Configuração, auditoria, gestão de usuários. |
| **Almoxarife** | Operador de Estoque | Entradas, saídas de materiais, inventário físico. |
| **Colaborador** | Usuário Final | Solicitação de bens, assinatura de termos de responsabilidade. |
| **Auditoria** | Auditor Externo/Interno | Verificação de logs e consistência patrimonial. |

---

## 3. Escopo do Projeto

### 3.1 O que o sistema FAZ (In Scope)
- Gestão completa do ciclo de vida de Ativos (Patrimônio) e Produtos (Consumíveis).
- Operação 100% funcional em modo offline, com sincronização posterior.
- Controle de Manutenções (Preventiva/Corretiva) vinculadas a ativos.
- Checkouts (Empréstimos) de ativos para colaboradores com datas previstas de devolução.
- Gerenciamento de Centros de Custo e Localizações de Armazenamento.
- Dashboards analíticos para tomada de decisão.
- Exportação de dados para auditoria externa (PDF/Excel).

### 3.2 O que o sistema NÃO FAZ (Out of Scope)
- Emissão de Notas Fiscais Eletrônicas (integração com SEFAZ).
- Folha de Pagamento ou RH (apenas consome dados básicos de funcionários).
- Controle financeiro contábil avançado (depreciação fiscal automática).
- Rastreamento GPS em tempo real de ativos móveis (IoT).

### 3.3 Premissas e Restrições
- **Tecnológica**: O cliente deve possuir navegadores modernos ou sistema operacional Windows/macOS para o app desktop.
- **Conectividade**: A sincronização exige acesso à internet por HTTPS (porta 443).
- **Prazo**: Entrega da versão 1.0 (MVP) até [Data a definir].

---

**Aprovado por:**
__________________________
Engenheiro Chefe
