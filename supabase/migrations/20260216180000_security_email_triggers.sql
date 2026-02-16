
-- Enable the pg_net extension to send HTTP requests from the database
create extension if not exists "pg_net";

-- Create a secure schema for our private functions if not exists
create schema if not exists private;

-- Function to handle security events (password change, email change)
create or replace function private.handle_auth_user_security_update()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
  request_id bigint;
begin
  -- Check if encrypted_password has changed (Password Reset/Change)
  if (old.encrypted_password is distinct from new.encrypted_password) then
    payload := jsonb_build_object(
      'to', new.email,
      'template_name', 'password-changed',
      'data', jsonb_build_object(
        'email', new.email,
        'reset_url', 'http://localhost:3000/auth/reset-password' -- Update with your actual URL
      )
    );
    
    perform net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'x-forwarded-host' || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role', true)
      ),
      body := payload
    );
  end if;

  -- Check if email has changed
  if (old.email is distinct from new.email) then
     payload := jsonb_build_object(
      'to', new.email, -- Send to the NEW email
      'template_name', 'email-changed',
      'data', jsonb_build_object(
        'new_email', new.email,
        'old_email', old.email
      )
    );

    perform net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'x-forwarded-host' || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role', true)
      ),
      body := payload
    );
  end if;

  return new;
end;
$$;

-- Function to handle MFA events
create or replace function private.handle_auth_mfa_update()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
  user_email text;
begin
  -- Get user email
  select email into user_email from auth.users where id = coalesce(new.user_id, old.user_id);

  if (TG_OP = 'INSERT') then
    -- MFA Added
    payload := jsonb_build_object(
      'to', user_email,
      'template_name', 'mfa-added',
      'data', jsonb_build_object('email', user_email)
    );
  elsif (TG_OP = 'DELETE') then
    -- MFA Removed
    payload := jsonb_build_object(
      'to', user_email,
      'template_name', 'mfa-removed',
      'data', jsonb_build_object('email', user_email)
    );
  end if;

  if (payload is not null) then
      perform net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'x-forwarded-host' || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role', true)
        ),
        body := payload
      );
  end if;

  return null;
end;
$$;


-- Drop triggers if exist
drop trigger if exists on_auth_user_security_update on auth.users;
drop trigger if exists on_auth_mfa_insert on auth.mfa_factors;
drop trigger if exists on_auth_mfa_delete on auth.mfa_factors;

-- Create the trigger for Users (Password/Email)
create trigger on_auth_user_security_update
  after update on auth.users
  for each row
  execute function private.handle_auth_user_security_update();

-- Create triggers for MFA
create trigger on_auth_mfa_insert
  after insert on auth.mfa_factors
  for each row
  execute function private.handle_auth_mfa_update();

create trigger on_auth_mfa_delete
  after delete on auth.mfa_factors
  for each row
  execute function private.handle_auth_mfa_update();
