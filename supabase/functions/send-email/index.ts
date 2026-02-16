

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";
import { EMAIL_TEMPLATES } from "./templates.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a reusable transporter object using the default SMTP transport
const getTransporter = () => {
    const host = Deno.env.get('SMTP_HOST');
    const port = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const user = Deno.env.get('SMTP_USER');
    const pass = Deno.env.get('SMTP_PASS');
    const secure = Deno.env.get('SMTP_SECURE') === 'true'; // Usually false for 587 (STARTTLS), true for 465

    if (!host || !user || !pass) {
        throw new Error("Missing SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)");
    }

    return nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
            user,
            pass,
        },
    });
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { to, template_name, data, subject } = await req.json();

        if (!to) {
            throw new Error('Missing "to" field');
        }

        let htmlContent = "";
        let emailSubject = subject;

        // Resolve template if provided
        if (template_name && EMAIL_TEMPLATES[template_name]) {
            const template = EMAIL_TEMPLATES[template_name](data || {});
            htmlContent = template.html;
            emailSubject = template.subject;
        } else if (data?.html) {
            htmlContent = data.html;
        } else {
            throw new Error(`Template "${template_name}" not found and no HTML provided.`);
        }

        const transporter = getTransporter();

        // Get sender from env or default to the one seen in screenshot
        const sender = Deno.env.get('SMTP_SENDER') || 'Sis Davus | Davus Engenharia <admin@sis.davusengenharia.com.br>';

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: sender,
            to: to,
            subject: emailSubject,
            html: htmlContent,
        });

        console.log("Message sent: %s", info.messageId);

        return new Response(
            JSON.stringify(info),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

