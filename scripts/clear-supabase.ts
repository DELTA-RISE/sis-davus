
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function clear() {
    console.log('🧹 Starting cleanup...')

    const tables = [
        // Child tables first to avoid FK constraints
        'write_off_requests',
        'asset_timelines',
        'maintenance_tasks',
        'stock_movements',
        'checkouts',
        'job_queue',
        'compliance_reports',
        'admin_audit_logs',
        'access_logs',
        'audit_logs',
        'assets',
        'products',
        'cost_centers',
        'categories',
        'system_settings',
        // 'profiles' - KEEP PROFILES to preserve user accounts
    ]

    for (const table of tables) {
        console.log(`Deleting from ${table}...`)
        // delete all rows with a robust check (neq a zero UUID is usually safe for all tables with standard UUIDs)
        const { error: delError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')

        if (delError) {
            console.warn(`Error clearing ${table}:`, delError.message)
        }

    }

    console.log('✅ Cleanup completed!')
}

clear().catch((err) => {
    console.error('❌ Cleanup failed:', err)
    process.exit(1)
})
