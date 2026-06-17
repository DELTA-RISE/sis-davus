"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/dexie-db";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function RealtimeManager() {
    useEffect(() => {
        // Function to handle granular updates
        const handleRealtimeEvent = async (table: string, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;

            try {
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    // Update Dexie with the new record
                    // We trust Supabase RLS; if we receive it, we should see it.
                    if (newRecord) {
                        await db.table(table).put(newRecord);
                        // Optional: logic to notify UI if not using useLiveQuery
                    }
                } else if (eventType === 'DELETE') {
                    // Remove from Dexie
                    if (oldRecord && oldRecord.id) {
                        await db.table(table).delete(oldRecord.id as string);
                    }
                }
            } catch (error) {
                console.error(`Error handling realtime event for ${table}:`, error);
            }
        };

        const channel = supabase.channel('global-changes');

        channel
            // Users / Profiles
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                handleRealtimeEvent('profiles', payload);
            })
            // Categories
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
                handleRealtimeEvent('categories', payload);
            })
            // Cost Centers
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_centers' }, (payload) => {
                handleRealtimeEvent('cost_centers', payload);
            })
            // Products
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                handleRealtimeEvent('products', payload);
            })
            // Assets
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, (payload) => {
                handleRealtimeEvent('assets', payload);
            })
            // Write Off Requests
            .on('postgres_changes', { event: '*', schema: 'public', table: 'write_off_requests' }, (payload) => {
                handleRealtimeEvent('write_off_requests', payload);
            })
            // Maintenance Tasks
            .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, (payload) => {
                handleRealtimeEvent('maintenance_tasks', payload);
            })
            // Stock Movements
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, (payload) => {
                handleRealtimeEvent('stock_movements', payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return null;
}
