# 15. Política de Segurança da Informação (PSI)

Diretrizes de segurança para administradores e usuários do SisDavus.

## 1. Controle de Acesso

- **Princípio do Menor Privilégio**: Usuários devem receber o perfil mínimo necessário (User) e serem promovidos a Gestor/Admin apenas sob demanda.
- **Rotação de Senhas**: Recomendado a cada 90 dias.
- **Contas Genéricas**: Proibido o uso de contas compartilhadas (ex: `almoxarife@empresa.com`). Cada operador deve ter sua identidade nominal para rastreabilidade de auditoria.

## 2. Segurança Física e Dispositivos

- **Bloqueio de Tela**: Estações de trabalho devem ser bloqueadas (Win + L) ao se afastar.
- **Dispositivos Móveis**: Tablets usados para checkout de campo devem ter criptografia de disco ativada e senha/biometria.

## 3. Plano de Resposta a Incidentes (IRP)

Em caso de suspeita de violação (ex: Ativos sumiram do sistema, Admin não consegue logar):

1.  **Identificação**: Reportar ao Engenheiro Chefe imediatamente.
2.  **Contenção**:
    - Bloquear o usuário suspeito no painel Supabase.
    - Revogar todas as sessões ativas (Rotate JWT Secrets se crítico).
3.  **Erradicação**: Identificar vulnerabilidade (ex: Bug na validação) e aplicar Patch (Hotfix).
4.  **Recuperação**: Restaurar backup do Supabase (Point-in-Time Recovery) para momento anterior ao ataque.
5.  **Lições Aprendidas**: Preencher relatório de Post-Mortem.

## 4. Classificação da Informação

- **Pública**: Nenhuma (Sistema Interno).
- **Interna**: Listas de ativos, Localizações.
- **Confidencial**: Dados pessoais (CPF/Email), Valores de aquisição de ativos, Senhas.

---


