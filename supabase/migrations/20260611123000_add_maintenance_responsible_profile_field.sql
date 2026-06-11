alter table public.profiles
  add column if not exists department text;

comment on column public.profiles.department is
  'Internal app flag for special responsibilities, such as matriz_manutencao.';
