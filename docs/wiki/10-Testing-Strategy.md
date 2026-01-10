# 10. Estratégia de Testes (QA Plan)

Este documento define o plano mestre de testes para garantir a qualidade do SisDavus.

## 1. Pirâmide de Testes

O projeto segue uma adaptação da Pirâmide de Testes tradicional:

1.  **Testes Estáticos (Base)**: ESLint, TypeScript Check. Executados em tempo real na IDE e pré-commit.
2.  **Testes Unitários**: Vitest (se implementado) para funções puras em `src/lib/utils.ts` ou hooks complexos.
3.  **Testes E2E (Topo)**: Playwright. Foco principal da estratégia atual, pois valida a integração crítica (Banco Local <-> UI <-> Sync).

## 2. Matriz de Casos de Teste (Test Case Matrix)

Listagem dos cenários críticos que devem ser validados antes de cada Release Candidate (RC).

### Suite A: Autenticação
| ID | Caso de Teste | Passos | Resultado Esperado |
|:---|:---|:---|:---|
| TC01 | Login Sucesso | Inserir user/pass válidos | Redirecionar para Dashboard; Token no Storage. |
| TC02 | Login Falha | Inserir senha incorreta | Exibir Toast "Credenciais inválidas"; Não redirecionar. |
| TC03 | Logout | Clicar em Logout | Limpar tokens; Redirecionar para /login; Bloquear botão "Voltar". |

### Suite B: Ciclo de Vida do Ativo
| ID | Caso de Teste | Passos | Resultado Esperado |
|:---|:---|:---|:---|
| TC04 | Criar Ativo | Preencher form completo e salvar | Ativo aparece na lista; Toast de sucesso; Sync pendente ou OK. |
| TC05 | Editar Ativo | Alterar Status para "Em Uso" | Status atualizado na UI imediatamente. |
| TC06 | Validar Unicidade | Criar ativo com código duplicado | Sistema impede salvamento; Exibe erro no campo. |

### Suite C: Offline e Sync
| ID | Caso de Teste | Passos | Resultado Esperado |
|:---|:---|:---|:---|
| TC07 | Operação Offline | Desconectar rede; Criar Produto | Produto salvo localmente; Toast "Offline"; Ícone de sync pendente. |
| TC08 | Resync | Reconectar rede | Toast "Sincronizando"; Dados aparecem no Supabase Dashboard. |

## 3. Automação (Playwright)

Os testes automatizados residem em `/e2e`.

- **Execução CI**: Rodam em *headless mode* a cada Pull Request na branch `main`.
- **Browsers**: Chromium (Desktop), WebKit (Emulação iOS), Firefox.

```typescript
// Exemplo de Teste E2E (Pseudo-código)
test('should create asset offline', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto('/patrimonio/novo');
  await page.fill('#name', 'Notebook Teste');
  await page.click('button[type="submit"]');
  await expect(page.locator('.toast')).toContainText('salvo offline');
});
```

---


