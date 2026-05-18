-- Align the remote database with the columns currently used by the app.
-- This migration is intentionally additive and idempotent so it can be run
-- safely against clone/staging projects before being promoted to production.

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.products
  add column if not exists supplier text,
  add column if not exists image_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.assets
  add column if not exists status text default U&'Dispon\00EDvel',
  add column if not exists purchase_date date,
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.stock_movements
  add column if not exists user_id text,
  add column if not exists created_at timestamptz not null default now();

alter table public.checkouts
  add column if not exists user_id text,
  add column if not exists expected_return_date date,
  add column if not exists created_at timestamptz not null default now();

alter table public.maintenance_tasks
  add column if not exists cost numeric(12, 2) default 0;

alter table public.cost_centers
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.categories
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_products_updated_at') then
    create trigger set_products_updated_at
      before update on public.products
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_assets_updated_at') then
    create trigger set_assets_updated_at
      before update on public.assets
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_cost_centers_updated_at') then
    create trigger set_cost_centers_updated_at
      before update on public.cost_centers
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_profiles_updated_at') then
    create trigger set_profiles_updated_at
      before update on public.profiles
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_categories_updated_at') then
    create trigger set_categories_updated_at
      before update on public.categories
      for each row execute function public.update_updated_at_column();
  end if;
end;
$$;
