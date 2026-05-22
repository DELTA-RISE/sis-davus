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
