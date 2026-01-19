import { supabase } from "@/lib/supabase";

const TABLES = [
    "products",
    "assets",
    "stock_movements",
    "maintenance_tasks",
    "checkouts",
    "cost_centers",
    "admin_audit_logs",
    "profiles",
    "asset_timelines"
];

export async function getServerCounts() {
    const counts: Record<string, number> = {};

    try {
        for (const table of TABLES) {
            let query = supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            // Filter filters for tables supporting soft delete
            if (table === 'products' || table === 'assets') {
                query = query.is('deleted_at', null);
            }

            const { count, error } = await query;

            if (error) {
                console.error(`Error counting ${table}:`, error);
                counts[table] = -1; // Indicate error
            } else {
                counts[table] = count || 0;
            }
        }
        return { success: true, counts };
    } catch (error) {
        console.error("Diagnostic error:", error);
        return { success: false, error: "Failed to fetch server counts" };
    }
}
