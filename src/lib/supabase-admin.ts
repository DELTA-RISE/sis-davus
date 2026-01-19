import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Safe check: if we are on the client properly (or in a mixed environment where this file is evaluated but not used),
// we shouldn't throw immediately unless we actually try to use it, OR we are sure we are on the server.
// However, to fix the immediate crash:
if ((!supabaseUrl || !supabaseServiceRoleKey) && typeof window === 'undefined') {
    throw new Error('Missing Supabase URL or Service Role Key');
}

export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : {} as any; // Fallback to avoid crash on client, but will fail if used.

