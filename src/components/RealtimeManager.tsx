"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    syncTable,
    syncAssets,
    syncCategories,
    syncCostCenters,
    syncUsers
} from "@/lib/db";
import { toast } from "sonner";

export function RealtimeManager() {
    useEffect(() => {
        // We can group subscriptions or have separate channels.
        // A single channel for everything is often simpler if volume is low.
        const channel = supabase.channel('global-changes');

        channel
            // Users / Profiles
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                console.log('Realtime: profiles updated');
                syncUsers();
            })
            // Categories
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                console.log('Realtime: categories updated');
                syncCategories();
            })
            // Cost Centers
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_centers' }, () => {
                console.log('Realtime: cost_centers updated');
                syncCostCenters();
            })
            // Products (Global sync for low stock alerts etc, though pages usually have their own)
            // It's safe to sync again or rely on this global one.
            // If pages also subscribe, we might get double syncs.
            // But `syncTable` is relatively cheap if data hasn't changed much (but it does clear/fill).
            // Optimization: Only sync if not on a specific page? Or let the pages handle their own?
            // The request is "Full System Realtime".
            // TopBar needs product updates even if not on /estoque.
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                console.log('Realtime: products updated');
                // We use the generic syncTable here.
                // NOTE: `getProducts` in db.ts uses specific filtering. `syncTable` pulls ALL (active?).
                // Check db.ts: `syncTable` pulls `select *`.
                // If the user is a manager, they might pull data they shouldn't see?
                // RLS on Supabase should prevent fetching restricted row.
                // So `syncTable` is safe IF RLS is set up correctly.
                syncTable('products', 'name', true);
            })
            // Assets
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
                console.log('Realtime: assets updated');
                syncAssets();
            })
            // Write Off Requests (for notifications)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'write_off_requests' }, () => {
                console.log('Realtime: write_off_requests updated');
                syncTable('write_off_requests');
            })
            // Maintenance Tasks (for notifications)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, () => {
                console.log('Realtime: maintenance_tasks updated');
                syncTable('maintenance_tasks'); // We might need a syncMaintenanceTasks if filtering is complex
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('RealtimeManager: Connected to Supabase Realtime');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return null; // Headless component
}
