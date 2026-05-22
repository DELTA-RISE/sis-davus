alter table public.checkouts
  add column if not exists quantity integer not null default 1,
  add column if not exists return_date timestamptz;

update public.checkouts
set quantity = 1
where quantity is null;
