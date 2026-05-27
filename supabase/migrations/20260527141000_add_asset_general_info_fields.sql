alter table public.assets
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists serial_number text;
