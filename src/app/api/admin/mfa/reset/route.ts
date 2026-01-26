import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with the SERVICE ROLE key to perform admin actions
// This MUST NOT be exposed to the client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // 1. Check if the requester is an admin
        // We need to verify the user's session token from the request headers
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify "admin" role from public.users or app_metadata
        // Assuming app_metadata.role or public.users table check. 
        // For safety, let's query the public.users table which we trust more if it has 'role'
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userError || userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Get target user ID from body
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 3. Remove all MFA factors for the user
        const { data: factors, error: listError } = await supabaseAdmin.auth.admin.mfa.listFactors({
            userId: userId
        });

        if (listError) {
            throw listError;
        }

        const deletedFactors = [];
        for (const factor of factors.factors) {
            const { data, error } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
                userId: userId,
                id: factor.id
            });
            if (!error) {
                deletedFactors.push(factor.id);
            }
        }

        return NextResponse.json({ success: true, message: `MFA reset for user ${userId}`, deletedCount: deletedFactors.length });
    } catch (error: any) {
        console.error('Error resetting MFA:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
