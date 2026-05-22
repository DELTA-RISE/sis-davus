-- Allow the internal operator profile in the profiles.role check constraint.
-- The app normalizes "operator" to "operador", but this accepts both values
-- so old queued/offline writes do not fail while users are upgraded.

update public.profiles
set role = 'operador'
where role = 'operator';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'gestor', 'operador', 'operator', 'user', 'manager'));
