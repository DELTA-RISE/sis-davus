# 14. Conformidade Legal e Privacidade (LGPD)

Documento de adequação à Lei Geral de Proteção de Dados (Lei 13.709/2018).

## 1. Inventário de Dados Pessoais (PII)

O SisDavus coleta e processa os seguintes dados pessoais:

| Dado | Finalidade | Base Legal (LGPD) | Retenção |
|:---|:---|:---|:---|
| **Nome Completo** | Identificação em Checkouts e Logs | Execução de Contrato / Legítimo Interesse | 5 anos após desligamento |
| **Email Corporativo** | Login e Notificações | Execução de Contrato | Permanente enquanto ativo |
| **Foto (Avatar)** | Identificação Visual | Consentimento | Até revogação ou exclusão |
| **IP de Acesso** | Auditoria de Segurança | Cumprimento de Obrigação Legal (Marco Civil) | 6 meses (mínimo) |

## 2. Direitos do Titular (DSR)

Como o sistema atende às requisições dos titulares:

1.  **Acesso**: O usuário pode ver todos os seus dados na tela `/perfil`.
2.  **Retificação**: O usuário pode alterar nome/foto em `/perfil/ajustes`.
3.  **Exclusão**: O "Direito ao Esquecimento" é limitado pois logs de auditoria devem ser mantidos por lei/compliance. A conta é "Inativada" (Soft Delete), removendo acesso mas mantendo histórico de responsabilidade patrimonial.

## 3. Política de Cookies e Storage

O sistema utiliza apenas armazenamento essencial técnica:
- **LocalStorage/IndexedDB**: Armazena dados de trabalho (ativos, produtos). Não usado para tracking publicitário.
- **Cookies Supabase**: Apenas para manter a sessão de autenticação segura.

---


