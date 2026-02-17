-- Function to get active sessions for the current user
create or replace function public.get_my_sessions()
returns table (
  id uuid,
  user_agent text,
  ip text,
  created_at timestamptz,
  last_active_at timestamptz,
  is_current boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    s.id,
    s.user_agent,
    s.ip::text,
    s.created_at,
    s.refreshed_at at time zone 'utc' as last_active_at,
    (s.id::text = (select auth.jwt() ->> 'session_id')) as is_current
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.refreshed_at desc;
end;
$$;

-- Function to revoke a specific session
create or replace function public.revoke_my_session(session_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Only allow deleting own sessions
  delete from auth.sessions
  where id = session_id
  and user_id = auth.uid();
  
  return found;
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function public.get_my_sessions() to authenticated;
grant execute on function public.revoke_my_session(uuid) to authenticated;
