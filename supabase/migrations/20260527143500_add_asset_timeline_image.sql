alter table public.asset_timelines
  add column if not exists image_url text;
