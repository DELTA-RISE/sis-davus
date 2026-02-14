-- 7-Day Hard Delete Policy Migration
-- Created at 2026-02-14 20:12:00 UTC

-- Enable pg_cron if not already enabled (this requires superuser or relevant permission, otherwise assume it's set up)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION cleanup_deleted_items() RETURNS void AS $$
BEGIN
  -- 1. Detach related data (set FK to NULL) for items to be deleted (older than 7 days).
  
  -- Maintenance Tasks
  UPDATE maintenance_tasks 
  SET asset_id = NULL 
  WHERE asset_id IN (SELECT id FROM assets WHERE deleted_at < NOW() - INTERVAL '7 days');
  
  -- Asset Timelines
  UPDATE asset_timelines
  SET asset_id = NULL
  WHERE asset_id IN (SELECT id FROM assets WHERE deleted_at < NOW() - INTERVAL '7 days');

  -- Write Off Requests
  UPDATE write_off_requests
  SET asset_id = NULL
  WHERE asset_id IN (SELECT id FROM assets WHERE deleted_at < NOW() - INTERVAL '7 days');

  -- Stock Movements
  UPDATE stock_movements 
  SET product_id = NULL 
  WHERE product_id IN (SELECT id FROM products WHERE deleted_at < NOW() - INTERVAL '7 days');

  -- 2. Delete logs (admin_audit_logs)
  DELETE FROM admin_audit_logs 
  WHERE resource_id::text IN (SELECT id::text FROM assets WHERE deleted_at < NOW() - INTERVAL '7 days')
     OR resource_id::text IN (SELECT id::text FROM products WHERE deleted_at < NOW() - INTERVAL '7 days');

  -- 3. Hard Delete the Items
  DELETE FROM assets WHERE deleted_at < NOW() - INTERVAL '7 days';
  DELETE FROM products WHERE deleted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the job
-- This uses SELECT directly. If user runs this multiple times, it creates multiple jobs unless we handle duplication.
-- pg_cron doesn't have "CREATE OR REPLACE SCHEDULE" easily accessible in one line usually without logic.
-- However, `cron.schedule` returns the job ID if created.
-- A safe way is to unschedule first to avoid duplicates if re-run.
SELECT cron.unschedule('hard-delete-cleanup');
SELECT cron.schedule('hard-delete-cleanup', '0 0 * * *', 'SELECT cleanup_deleted_items()');
