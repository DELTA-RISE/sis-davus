# 17. Guia de Solução de Problemas (Troubleshooting)

Referência rápida para erros comuns reportados por usuários.

| Sintoma | Causa Provável | Solução Recomendada |
|:---|:---|:---|
| **Erro "Falha na Autenticação"** | Senha errada ou usuário inativo. | 1. Verificar se Caps Lock está ativo.<br>2. Admin: Verificar se status do user é 'active'.<br>3. Admin: Resetar senha. |
| **Dados não aparecem na lista** | Filtro ativo ou cache desatualizado. | 1. Clicar em "Limpar Filtros".<br>2. Recarregar a página (F5). |
| **"Erro ao Sincronizar" (Toast Vermelho)** | Conflito de IDs ou Falha de Rede momentânea. | 1. Verificar conexão.<br>2. Se persistir, contatar Suporte Técnico (TI) para analisar logs do browser. |
| **App Desktop travado** | Processo Electron "zumbi". | 1. Fechar janela.<br>2. Verificar Gerenciador de Tarefas e matar processos "SisDavus".<br>3. Reabrir. |
| **Scanner de QR Code não abre câmera** | Permissão negada no SO. | 1. Verificar Configurações de Privacidade do Windows/Mac.<br>2. Permitir acesso à câmera para o app SisDavus. |

---


