alter table public.checkouts
  add column if not exists user_id text,
  add column if not exists quantity integer not null default 1,
  add column if not exists expected_return_date date,
  add column if not exists return_date timestamptz,
  add column if not exists created_at timestamptz not null default now();

update public.checkouts
set quantity = 1
where quantity is null;

alter table public.checkouts
  drop constraint if exists checkouts_status_check;

alter table public.checkouts
  add constraint checkouts_status_check
  check (
    status in (
      'Ativo',
      'Devolvido',
      'Atrasado',
      'ativo',
      'devolvido',
      'atrasado',
      'active',
      'returned',
      'overdue'
    )
  );
