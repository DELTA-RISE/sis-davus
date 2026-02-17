-- Create access_logs table if it doesn't exist
create table if not exists public.access_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ip_address text,
  user_agent text,
  location text,
  device_info text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.access_logs enable row level security;

-- Policies
create policy "Users can view their own logs"
  on public.access_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.access_logs for insert
  with check (auth.uid() = user_id);

-- Grants
grant select, insert on public.access_logs to authenticated;
grant select, insert on public.access_logs to service_role;

-- Trigger 1: Enrich IP from Request Headers (Frontend often sends 0.0.0.0)
create or replace function private.handle_new_access_log()
returns trigger
language plpgsql
security definer
as $$
declare
  headers jsonb;
  real_ip text;
begin
  -- Try to get headers
  begin
    headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    headers := '{}'::jsonb;
  end;

  -- Extract IP (x-forwarded-for often has multiple IPs, take the first)
  real_ip := headers->>'x-forwarded-for';
  if real_ip is not null then
    real_ip := split_part(real_ip, ',', 1);
  end if;

  -- Fallback or Override if '0.0.0.0' or null
  if new.ip_address is null or new.ip_address = '0.0.0.0' then
     if real_ip is not null then
       new.ip_address := real_ip;
     end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_access_log_insert_enrich on public.access_logs;
create trigger on_access_log_insert_enrich
  before insert on public.access_logs
  for each row
  execute function private.handle_new_access_log();

-- Trigger 2: Alert on New IP/Device
create or replace function private.handle_new_ip_alert()
returns trigger
language plpgsql
security definer
as $$
declare
  previous_log_count int;
  user_email text;
  payload jsonb;
  auth_header text;
  host_header text;
begin
  -- Check if this IP has been seen before for this user (excluding the current one)
  -- Since this is AFTER insert, we check if count > 1. 
  -- IF count is 1, it's the first time.
  select count(*) into previous_log_count
  from public.access_logs
  where user_id = new.user_id
    and ip_address = new.ip_address;

  -- If this is the FIRST record (count=1), send alert
  if previous_log_count = 1 then
      -- Get email
      select email into user_email from auth.users where id = new.user_id;
      
      -- Get Auth Header safely
      begin
        auth_header := current_setting('request.headers', true)::jsonb->>'authorization';
      exception when others then
        auth_header := null;
      end;
      
      -- If no header (internal/trigger), fallback or skip? 
      -- We'll try to construct one or just pass what we found.
      if auth_header is null then
         -- Fallback for testing, though likely won't work for secured functions without key
         auth_header := 'Bearer ' || current_setting('request.jwt.claim.role', true); 
      end if;

      -- Determine location (Mock/Placeholder if empty)
      if new.location is null then
         new.location := 'Localização Desconhecida';
      end if;

      -- Send Email
      payload := jsonb_build_object(
        'to', user_email,
        'template_name', 'new-device-login',
        'data', jsonb_build_object(
          'email', user_email,
          'ip_address', new.ip_address,
          'device_info', new.device_info,
          'location', new.location,
          'time', to_char(now(), 'DD/MM/YYYY HH24:MI')
        )
      );

      -- Get Host Header safely
      begin
        host_header := current_setting('request.headers', true)::jsonb->>'x-forwarded-host';
      exception when others then
        host_header := null;
      end;

      if host_header is null then
         host_header := 'localhost:3000'; -- Fallback
      end if;

      perform net.http_post(
        url := 'https://' || host_header || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', auth_header
        ),
        body := payload
      );
  end if;

  return null;
end;
$$;

drop trigger if exists on_access_log_insert_alert on public.access_logs;
create trigger on_access_log_insert_alert
  after insert on public.access_logs
  for each row
  execute function private.handle_new_ip_alert();
