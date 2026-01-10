# 08. Segurança de Backend e Auth

Documentação das práticas de segurança implementadas na camada de dados e serviços.

## 1. Supabase Authentication

### Fluxo de Identidade
O SisDavus utiliza JWT (JSON Web Tokens) para stateless authentication.
1.  Cliente envia user/pass para endpoint `/auth/v1/token`.
2.  Supabase retorna `access_token` (curta duração) e `refresh_token`.
3.  O Cliente armazena tokens (LocalStorage ou Cookie Seguro, dependendo da config).
4.  O `access_token` é enviado no Header `Authorization: Bearer <token>` em toda requisição.

### Policies (RLS - Row Level Security)

O PostgreSQL no Supabase atua como "Firewall de Dados". Nenhuma query SQL passa sem ser interceptada pelas políticas RLS.

#### Matriz de Acesso RLS

| Tabela | Policy Name | Regra (USING / WITH CHECK) | Permissão | Roles |
| :--- | :--- | :--- | :--- | :--- |
| `products` | `Enable read access for all authenticated users` | `auth.role() = 'authenticated'` | SELECT | Todos |
| `products` | `Enable insert for managers only` | `auth.jwt() ->> 'role' IN ('admin', 'manager')` | INSERT/UPDATE | Admin, Manager |
| `admin_audit_logs` | `Admins can view audit logs` | `auth.jwt() ->> 'role' = 'admin'` | SELECT | Admin |
| `profiles` | `Users can update own profile` | `auth.uid() = id` | UPDATE | Dono |

## 2. Segurança de Aplicação

### Proteção contra XSS (Cross-Site Scripting)
- O React escapa automaticamente todo conteúdo renderizado no JSX.
- `dangerouslySetInnerHTML` é estritamente proibido, exceto em componentes controlados de renderização de Markdown (se houver).

### Proteção contra CSRF (Cross-Site Request Forgery)
- Como utilizamos autenticação baseada em Headers (Bearer Token) e não cookies de sessão tradicionais, o risco de CSRF é mitigado por padrão.
- O SameSite policy dos cookies do Supabase adiciona camada extra.

### Sanitização de Dados
- Entradas de API e Banco de Dados são tipadas fortemente e, no caso do Supabase, utilizam Prepared Statements por baixo dos panos, eliminando risco de **SQL Injection**.

## 3. Auditoria

Para conformidade com requisitos de segurança corporativa, todas as ações destrutivas (Delete) ou modificações sensíveis (Alterar Permissão) geram logs imutáveis na tabela `admin_audit_logs`.

---

[Próximo: Integração Desktop →](./09-Desktop-Integration.md)
