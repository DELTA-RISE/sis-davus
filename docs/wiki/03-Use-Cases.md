# 03. Casos de Uso (Use Cases)

Documentação detalhada dos principais cenários de interação Usuário-Sistema.

## Diagrama de Atores

- **Administrador**: Tem acesso total ao sistema.
- **Gestor**: Foca nas operações de dia-a-dia (Mover estoque, cadastrar ativos).
- **Usuário Padrão**: Apenas visualiza seus ativos e solicitações.

---

## Especificação dos Casos de Uso

### UC01 - Realizar Checkout de Ativo

**Descrição**: O processo de entregar um ativo físico para um colaborador e registrar a responsabilidade no sistema.
**Atores**: Gestor, Administrador.
**Pré-condições**:
1. O usuário (colaborador) deve estar cadastrado.
2. O ativo deve estar com status "Disponível".

**Fluxo Principal**:
1. O Ator acessa a tela de "Ativos Disponíveis".
2. O Ator seleciona a opção "Realizar Checkout".
3. O Sistema solicita o Usuário Destinatário e a Data Prevista de Devolução.
4. O Ator insere os dados e confirma.
5. O Sistema valida as regras de disponibilidade (RN02).
6. O Sistema altera o status do ativo para "Em Uso".
7. O Sistema cria um registro na tabela `checkouts`.
8. O Sistema emite confirmação visual.

**Fluxo Alternativo (Ativo em Manutenção)**:
- 5a. O ativo está em manutenção.
- 5b. O sistema bloqueia a operação e exibe mensagem de erro: "Ativo indisponível para uso".
- 5c. O caso de uso encerra.

**Pós-condições**:
- O ativo não aparece mais na lista de disponíveis.
- Um email de notificação é enviado ao colaborador (se online).

---

### UC02 - Sincronização de Dados Offline

**Descrição**: O mecanismo automático que envia dados coletados sem internet para o servidor central.
**Atores**: Sistema (Tempo), Usuário (Trigger manual).
**Gatilho**: O navegador detecta evento `online` ou o usuário clica em "Sincronizar Agora".

**Fluxo Principal**:
1. O Sistema detecta restabelecimento de conexão.
2. O Sistema consulta a tabela local `sync_queue`.
3. Se houver itens pendentes, inicia loop de processamento.
4. Para cada item:
    - Envia requisição (POST/PUT/DELETE) para API Supabase.
    - Aguarda status 200 OK.
    - Remove item da fila local.
5. O Sistema exibe notificação "Sincronização Concluída".

**Fluxo de Exceção (Falha de Validação Servidor)**:
- 4a. O servidor retorna erro 409 (Conflito) ou 400 (Bad Request).
- 4b. O sistema marca o item na fila como `failed`.
- 4c. O sistema continua para o próximo item.
- 5. O sistema notifica "Sincronização Parcial: X erros".

---

### UC03 - Baixa de Ativo (Descarte)

**Descrição**: Remover um ativo do inventário ativo por obsolescência, roubo ou dano irreparável.
**Atores**: Administrador.

**Fluxo Principal**:
1. O Administrador localiza o ativo.
2. Seleciona "Dar Baixa".
3. O Sistema solicita o motivo (Venda, Roubo, Quebra, Obsolescência).
4. O Administrador confirma a ação.
5. O Sistema altera status para "Baixado".
6. O Sistema registra log de auditoria crítico.
7. O ativo é removido das listagens operacionais, mantendo-se apenas em relatórios históricos.

---

[Próximo: Arquitetura do Sistema →](./04-System-Architecture.md)
