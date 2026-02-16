-- Fix function search paths to prevent hijacking
ALTER FUNCTION public.check_low_stock() SET search_path = public, pg_catalog;
ALTER FUNCTION public.cleanup_deleted_items() SET search_path = public, pg_catalog;
ALTER FUNCTION public.generate_monthly_compliance_report() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog;
ALTER FUNCTION public.invoke_process_queue() SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_catalog;
ALTER FUNCTION public.search_global(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;

-- Fix RLS policies to be explicit about authenticated role instead of generic "true"

-- asset_timelines
ALTER POLICY "Authenticated users can delete asset_timelines" ON public.asset_timelines USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert asset_timelines" ON public.asset_timelines WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update asset_timelines" ON public.asset_timelines USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- assets
ALTER POLICY "Authenticated users can delete assets" ON public.assets USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert assets" ON public.assets WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update assets" ON public.assets USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- audit_logs
ALTER POLICY "Authenticated users can delete audit_logs" ON public.audit_logs USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert audit_logs" ON public.audit_logs WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update audit_logs" ON public.audit_logs USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- checkouts
ALTER POLICY "Authenticated users can delete checkouts" ON public.checkouts USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert checkouts" ON public.checkouts WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update checkouts" ON public.checkouts USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- cost_centers
ALTER POLICY "Authenticated users can delete cost_centers" ON public.cost_centers USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert cost_centers" ON public.cost_centers WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update cost_centers" ON public.cost_centers USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- maintenance_tasks
ALTER POLICY "Authenticated users can delete maintenance_tasks" ON public.maintenance_tasks USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert maintenance_tasks" ON public.maintenance_tasks WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update maintenance_tasks" ON public.maintenance_tasks USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- products
ALTER POLICY "Authenticated users can delete products" ON public.products USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert products" ON public.products WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update products" ON public.products USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- stock_movements
ALTER POLICY "Authenticated users can delete stock_movements" ON public.stock_movements USING (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can insert stock_movements" ON public.stock_movements WITH CHECK (auth.role() = 'authenticated');
ALTER POLICY "Authenticated users can update stock_movements" ON public.stock_movements USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
