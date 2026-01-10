# 13. Análise de Riscos (FMEA)

Matriz de Análise de Modos de Falha e Efeitos (Failure Modes and Effects Analysis) para o SisDavus.

## Metodologia
- **Gravidade (G)**: 1 (Leve) a 5 (Catastrófico).
- **Probabilidade (P)**: 1 (Rara) a 5 (Frequente).
- **Risco (R)**: G * P. (Níveis: 1-5 Baixo, 6-12 Médio, 15-25 Crítico).

## Matriz de Riscos

| ID | Modo de Falha | Efeito | Causa | G | P | R | Mitigação / Contingência |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **RSK01** | **Conflito de Sync** | Perda de dados de uma edição | Dois usuários editam o mesmo ativo offline | 3 | 4 | **12** (Med) | Implementar merge manual futuro. No MVP, "Last Write Wins" e Logs de Auditoria. |
| **RSK02** | **Full Storage** | App para de salvar dados | Disco cheio ou cota IndexedDB excedida | 4 | 2 | **8** (Med) | Monitorar `navigator.storage.estimate()` e alertar usuário aos 90%. |
| **RSK03** | **Vazamento JWT** | Acesso não autorizado | Token roubado via XSS ou PC compartilhado | 5 | 2 | **10** (Med) | Tokens com expiração curta (1h). Logout automático por inatividade (não implementado no MVP). |
| **RSK04** | **Corrupção Local** | App não abre (Tela Branca) | Falha no IndexedDB ou atualização quebrada | 4 | 1 | **4** (Bx) | Botão de "Hard Reset" na tela de erro global. |
| **RSK05** | **Offline Permanente** | Dados nunca sobem para nuvem | Dispositivo danificado antes do sync | 4 | 1 | **4** (Bx) | Não há mitigação técnica. Procedimento operacional de sync diário obrigatório. |

## Plano de Continuidade de Negócios (BCP)

Caso o sistema saia do ar completamente (Supabase Down):
1.  **Modo Offline**: Operação continua normalmente para leitura e checkouts locais.
2.  **Backup Manual**: Em caso de falha dos dispositivos, utilizar a planilha de contingência [TEMPLATE_XLS].

---


