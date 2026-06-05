alter table public.asset_timelines
drop constraint if exists asset_timelines_type_check;

alter table public.asset_timelines
add constraint asset_timelines_type_check
check (
  type in (
    'criacao',
    'movimentacao',
    'manutencao',
    'checkout',
    'devolucao',
    'atualizacao',
    'maintenance',
    'assignment',
    'location',
    'status',
    'audit'
  )
);
