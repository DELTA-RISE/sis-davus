# 11. Guia de Estilo e Padrões de Código

Para manter a consistência e qualidade do código do SisDavus, seguimos as seguintes convenções.

## Linter e Formatação

Utilizamos **AGORA** o padrão configurado no `eslint.config.mjs`. Use sempre que possível:
```bash
bun run lint
```

## Convenções de Nomenclatura

- **Componentes React**: PascalCase. Ex: `UserProfile.tsx`, `SubmitButton.tsx`.
- **Funções e Variáveis**: camelCase. Ex: `getUserData()`, `isActive`.
- **Arquivos de Utilitários**: kebab-case. Ex: `offline-sync.ts`, `format-date.ts`.
- **Interfaces/Types**: PascalCase. Ex: `Product`, `UserRole`.
- **Pastas**: kebab-case, exceto para componentes que podem ser agrupados.

## Estrutura de Componentes

Preferimos componentes funcionais com Hooks.

```tsx
// Bom
export function UserCard({ user }: UserCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-4 bg-card rounded-lg">
      <h1>{user.name}</h1>
    </div>
  );
}
```

## CSS / Tailwind

- Utilize classes utilitárias para quase tudo.
- Para estilos complexos ou repetitivos, componentize ou use `@apply` no CSS global com parcimônia.
- Mantenha a ordem das classes lógica (ex: layout -> spacing -> typography -> colors).
- Use o plugin `prettier-plugin-tailwindcss` se disponível para ordenação automática.

## Commits

Recomendamos o padrão **Conventional Commits**:

- `feat:` Nova funcionalidade. Ex: `feat: adiciona sync de produtos`.
- `fix:` Correção de bug. Ex: `fix: erro ao salvar ativo offline`.
- `docs:` Documentação. Ex: `docs: atualiza wiki`.
- `chore:` Tarefas de manutenção. Ex: `chore: atualiza dependências`.
- `refactor:` Mudança de código que não altera funcionalidade.

## Comentários

- **Evite** comentários óbvios (`// define variável x`).
- **Use** comentários para explicar o "PORQUÊ" de uma lógica complexa ou workaround.
- Mantenha JSDoc ou TSDoc em funções utilitárias exportadas.

---

**Fim da Wiki Técnica do SisDavus.**
