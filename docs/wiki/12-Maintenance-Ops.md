# 12. Operações e Manutenção (Ops Manual)

Guia para equipes de suporte e operações manterem o SisDavus funcionando.

## 1. Monitoramento

### Logs de Erro (Client Side)
Erros não tratados no React são capturados pelo `ErrorBoundary` e, idealmente, enviados para um serviço de agregação (como Sentry).
- **Localização**: Console do DevTools (F12) é a primeira linha de investigação.
- **Padrão**: Procure por strings começando com `[Supabase Error]` ou `[Sync Error]`.

### Saúde do Banco de Dados
Verificar periodicamente no Dashboard do Supabase:
- **Tamanho do Banco**: Se próximo do limite do plano (500MB no Free Tier).
- **Conexões Ativas**: Se há picos anormais de conexões (Pooling).

## 2. Troubleshooting Comum

### Problema: "Não consigo logar"
1.  Verificar conexão com internet (Auth exige online).
2.  Verificar se usuário está com status `active` na tabela `profiles`.
3.  Resetar senha via Painel Admin se necessário.

### Problema: "Meus dados não sincronizam"
1.  Pressione F12 -> Application -> IndexedDB -> SisDavusDB -> sync_queue.
2.  Se houver muitos itens com status `failed`, verifique o campo `payload`.
3.  **Solução de Contorno**: O usuário pode estar tentando editar um ativo que foi deletado no servidor. A solução é limpar o banco local (Cache Storage) e relogar, baixando os dados frescos (atenção: dados não sincronizados serão perdidos).

### Problema: "Tela Branca (WSOD)"
1.  Geralmente causado por dados corrompidos no LocalStorage.
2.  Ação: Limpar dados de navegação do site ou reinstalar app Desktop.

## 3. Procedimentos de Backup

### Backup de Dados (Supabase)
O Supabase realiza backups diários automáticos (PITR).
- **Restauração**: Via painel do Supabase -> Database -> Backups.

### Backup de Código
O repositório Git é a fonte única da verdade. Garantir que a branch `main` esteja sempre funcional.

---


