# 07. Engenharia de Frontend

Detalhamento técnico das patterns de código e arquitetura React/Next.js.

## 1. Arquitetura Next.js App Router

Utilizamos a convenção de **Route Groups** para separar layouts lógicos sem afetar a URL.

- `(auth)`: Layout minimalista, focado em conversão (Login).
- `(dashboard)`: Layout rico da aplicação principal.
    - `layout.tsx`: Provider Hell (Contexts) + Sidebar + Main Content Area.
    - `error.tsx`: Error Boundary global para capturar crashes.
    - `loading.tsx`: Skeleton Screens automáticas do Next.js.

## 2. Gerenciamento de Estado

### Zustand Store
Usado para estados globais de UI que não precisam de persistência complexa.
- **Implementação**: `src/lib/store.ts` (embora atualmente focado em Types, o padrão seria `src/store/ui-store.ts`).
- **Pattern**: Fluxo unidirecional. Actions modificam o estado, componentes assinam seletores.

### Server State vs Client State
- **Server State**: Gerenciado pelo React Query (ou custom hooks em `db.ts` simulando isso). Dados vindos do Dexie/Supabase.
- **Client State**: Formulários (`react-hook-form`), modais abertos, filtros ativos.

## 3. Otimização de Performance (Web Vitals)

### FCP (First Contentful Paint)
- Estratégia: O CSS crítico é injetado pelo Tailwind. O bundle JS é deferido.
- Fontes: `next/font` para otimização e pre-load da fonte Inter.

### LCP (Largest Contentful Paint)
- Problema comum: Imagens de assets pesadas ou Dashboards complexos.
- Solução: Lazy Loading de componentes "abaixo da dobra" e uso de `Image` component do Next.js para otimização automática de WebP/AVIF.

### CLS (Cumulative Layout Shift)
- Solução: Skeletons com dimensões fixas (`CardSkeleton.tsx`) ocupam o espaço exato do conteúdo final enquanto carrega, evitando pulos.

## 4. Estratégia de Formulários e Validação

Todas as entradas de dados do usuário passam pela tríade:
1.  **React Hook Form**: Gestão de inputs não-controlados (performance).
2.  **Zod**: Definição de Schema e regras de validação.
3.  **Shadcn/UI Form**: Wrapper visual para exibir mensagens de erro acessíveis.

```typescript
// Exemplo de Schema
const productSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  price: z.coerce.number().positive(), // Coerção automática de string para number
});
```

---


