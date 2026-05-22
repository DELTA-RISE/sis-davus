-- Keep compatibility with older databases where cost_centers.code was required.
-- The current app no longer exposes this field, so it must not block inserts.

alter table public.cost_centers
  add column if not exists code text;

alter table public.cost_centers
  alter column code drop not null;

update public.cost_centers
set code = upper(regexp_replace(coalesce(name, 'CENTRO'), '[^a-zA-Z0-9]+', '-', 'g'))
where code is null;
