
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

console.log("Hello from Bulk Import!")

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        if (!supabaseServiceKey) {
            throw new Error("Missing Service Role Key");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { items, type } = await req.json()

        if (!items || !Array.isArray(items)) {
            throw new Error("Invalid payload: 'items' array required");
        }

        console.log(`Processing import of ${items.length} items of type ${type}`);

        // Batch insert logic
        // In a real scenario, this would parse a CSV from Storage.
        // Here we accept JSON directly for simplicity and demonstration.

        const targetTable = type === 'asset' ? 'assets' : 'products';

        const { data, error } = await supabase
            .from(targetTable)
            .upsert(items)
            .select();

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            message: `Imported ${data.length} items to ${targetTable}`,
            data: data
        }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
