create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_name text,
  action text not null,
  resource text not null,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_action_idx
  on public.admin_audit_logs (action);

create index if not exists admin_audit_logs_resource_idx
  on public.admin_audit_logs (resource);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
drop policy if exists "Authenticated users can insert own audit logs" on public.admin_audit_logs;

create policy "Admins can read audit logs"
  on public.admin_audit_logs
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

create policy "Authenticated users can insert own audit logs"
  on public.admin_audit_logs
  for insert
  with check (auth.uid() = user_id);
