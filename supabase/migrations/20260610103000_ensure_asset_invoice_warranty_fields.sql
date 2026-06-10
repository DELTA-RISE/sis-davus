alter table public.assets
  add column if not exists invoice_number text,
  add column if not exists warranty_months integer;

notify pgrst, 'reload schema';
