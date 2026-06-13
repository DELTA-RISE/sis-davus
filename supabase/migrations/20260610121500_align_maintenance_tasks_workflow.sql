alter table public.maintenance_tasks
  add column if not exists steps_data jsonb not null default '[]'::jsonb,
  add column if not exists approval_status text default 'pending',
  add column if not exists rejection_reason text,
  add column if not exists created_by text,
  add column if not exists manager_signature text,
  add column if not exists manager_signed_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists admin_signature text,
  add column if not exists admin_signed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.maintenance_tasks
  drop constraint if exists maintenance_tasks_status_check;

alter table public.maintenance_tasks
  add constraint maintenance_tasks_status_check
  check (
    status in (
      'Pendente',
      'Em Andamento',
      'Aguardando Aprovação',
      'Aguardando Aprovacao',
      'Aprovado',
      'Rejeitado',
      'Atrasada',
      'Concluída',
      'Concluida'
    )
  );

alter table public.maintenance_tasks
  drop constraint if exists maintenance_tasks_approval_status_check;

alter table public.maintenance_tasks
  add constraint maintenance_tasks_approval_status_check
  check (
    approval_status is null
    or approval_status in ('pending', 'approved', 'rejected')
  );
