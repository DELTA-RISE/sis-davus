
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

console.log("Hello from Process Queue!")

serve(async (req: Request) => {
    // Authorization check (Service Role needed)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        // Initialize Supabase Client with Service Role Key (from env)
        // Note: Deno deploy injects these env vars.
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        if (!supabaseServiceKey) {
            throw new Error("Missing Service Role Key");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch pending jobs (Locking would be better with 'for update skip locked' but simple select for now)
        // To prevent race conditions in high scale, we'd use a RPC function with 'for update skip locked'.
        // Here we'll just fetch one and try to update it to 'processing'.

        // Simplest queue logic:
        const { data: jobs, error: fetchError } = await supabase
            .from('job_queue')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(5)

        if (fetchError) throw fetchError;

        if (!jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ message: "No jobs to process" }), {
                headers: { "Content-Type": "application/json" },
            })
        }

        const results = [];

        // 2. Process Loop
        for (const job of jobs) {
            // Mark as processing
            await supabase.from('job_queue').update({ status: 'processing' }).eq('id', job.id);

            try {
                console.log(`Processing job ${job.id} type ${job.type}`);

                // --- JOB LOGIC SWITCH ---
                if (job.type === 'email_notification') {
                    // Simulate Email Sending
                    // await sendEmail(job.payload.to, job.payload.subject, job.payload.body);
                    console.log("Sending email to", job.payload.to);
                    await new Promise(r => setTimeout(r, 1000)); // Simulate delay
                }
                else if (job.type === 'ocr_processing') {
                    // Trigger OCR logic
                    console.log("Processing OCR for", job.payload.imageUrl);
                }
                // ------------------------

                // Mark as completed
                await supabase.from('job_queue').update({ status: 'completed' }).eq('id', job.id);
                results.push({ id: job.id, status: 'completed' });

            } catch (err) {
                console.error(`Job ${job.id} failed:`, err);
                // Update retry count or fail
                const nextAttempts = (job.attempts || 0) + 1;
                const status = nextAttempts >= (job.max_attempts || 3) ? 'failed' : 'pending';

                await supabase.from('job_queue').update({
                    status: status,
                    attempts: nextAttempts,
                    error_message: (err as Error).message
                }).eq('id', job.id);

                results.push({ id: job.id, status: 'failed', error: (err as Error).message });
            }
        }

        return new Response(JSON.stringify({ processed: results }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
