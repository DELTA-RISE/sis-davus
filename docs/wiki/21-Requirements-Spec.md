# 21. Especificação de Requisitos (SRS)

Este documento detalha os requisitos funcionais e não-funcionais do SisDavus, servindo como contrato técnico para o desenvolvimento e validação (QA).

## 1. Requisitos Funcionais (RF)

Os requisitos funcionais definem os comportamentos esperados do sistema.

### Módulo: Gestão de Patrimônio
| ID | Descrição | Prioridade | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **RF001** | O sistema deve permitir o cadastro de novos ativos com foto, código e nº de série. | Alta | Validação de unicidade do Código de Patrimônio. |
| **RF002** | O sistema deve permitir a alteração de status do ativo (Em Uso / Manutenção). | Alta | Histórico de timelines deve ser atualizado automaticamente. |
| **RF003** | O sistema deve gerar etiquetas QR Code para cada ativo cadastrado. | Média | QR Code deve ser legível por câmeras de celular e scanners 2D. |

### Módulo: Controle de Estoque
| ID | Descrição | Prioridade | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **RF004** | O sistema deve registrar entradas e saídas de produtos. | Alta | Saldo não pode ficar negativo. |
| **RF005** | O sistema deve alertar quando o estoque atingir o nível mínimo. | Média | Indicador visual no dashboard e na lista. |

### Módulo: Core / Sistema
| ID | Descrição | Prioridade | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **RF006** | O sistema deve autenticar usuários via Email e Senha. | Alta | Bloqueio após 5 tentativas falhas. |
| **RF007** | O sistema deve funcionar offline para operações de escrita. | Crítica | Dados salvos no IndexedDB e fila de sync criada. |
| **RF008** | O sistema deve sincronizar dados locais com o servidor quando online. | Crítica | Resolução de conflitos "Last Write Wins". |

### Módulo: Manutenção
| ID | Descrição | Prioridade | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **RF009** | O usuário deve poder agendar manutenções futuras. | Média | Ativo deve ficar indisponível para checkout no período. |
| **RF010** | O sistema deve manter histórico contínuo de intervenções por ativo. | Baixa | Visível na tela de detalhes do ativo. |

---

## 2. Requisitos Não-Funcionais (RNF)

Os RNFs definem atributos de qualidade, restrições e padrões.

| ID | Categoria | Descrição | Métrica / Restrição |
| :--- | :--- | :--- | :--- |
| **RNF01** | Performance | Tempo de carregamento inicial (FCP). | < 1.5 segundos em 4G. |
| **RNF02** | Usabilidade | Interface adaptável a dispositivos móveis. | Design Responsivo (Mobile First). |
| **RNF03** | Confiabilidade | Capacidade de operar sem servidor. | 100% das telas críticas acessíveis offline (PWA). |
| **RNF04** | Segurança | Criptografia de dados em trânsito e repouso. | HTTPS (TLS 1.2+) e RLS no Banco. |
| **RNF05** | Compatibilidade | Suporte a navegadores baseados em Chromium. | Chrome, Edge, Brave (Versões n-2). |
| **RNF06** | Manutenibilidade | Código tipado estaticamente. | TypeScript em 100% do projeto (modo strict). |

---

## 3. Regras de Negócio (RN)

| ID | Regra | Descrição |
| :--- | :--- | :--- |
| **RN01** | Unicidade de Patrimônio | Não podem existir dois ativos ativos com o mesmo código de etiqueta na mesma organização. |
| **RN02** | Bloqueio de Checkout | Ativos com status "Em Manutenção" ou "Baixado" não podem ser emprestados (Checkout). |
| **RN03** | Auditoria Imutável | Logs de auditoria (`admin_audit_logs`) nunca podem ser alterados ou excluídos, mesmo por administradores. |
| **RN04** | Troca de Senha | Novos usuários criados administrativamente devem trocar a senha no primeiro acesso (`must_change_password`). |

---

[Anexo: Diagrama de Casos de Uso](./03-Use-Cases.md)
