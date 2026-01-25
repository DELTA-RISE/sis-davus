
import { createClient } from '@supabase/supabase-js';

// Environment variables are loaded by Bun automatically
// If running with node, make sure to load .env.local

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStorage() {
    console.log('Starting Storage Verification...');

    // Authenticate
    console.log('🔄 Authenticating test user...');
    const email = `test-${Date.now()}@example.com`;
    const password = `pass-${Date.now()}`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('❌ Auth Failed:', authError.message);
        // Continue nicely even if auth fails, to show what happens
        // return; 
    } else {
        console.log('✅ Authenticated as:', authData.user?.id);
    }

    // 1. Test Public Bucket (Authenticated)
    console.log('\n--- Testing public-assets (Authenticated) ---');
    const publicFileName = `test-${Date.now()}.txt`;
    const publicContent = 'Hello Authenticated World';

    const { data: publicUpload, error: publicError } = await supabase.storage
        .from('public-assets')
        .upload(publicFileName, publicContent);

    if (publicError) {
        console.error('❌ Upload Public Failed:', publicError);
    } else {
        console.log('✅ Upload Public Success:', publicUpload?.path);

        // Check Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('public-assets')
            .getPublicUrl(publicFileName);

        console.log('ℹ️ Public URL:', publicUrl);

        // Validate access (fetch the URL)
        try {
            const res = await fetch(publicUrl);
            if (res.ok) {
                const text = await res.text();
                if (text === publicContent) console.log('✅ Public URL Access Confirmed');
                else console.error('❌ Public Content Mismatch');
            } else {
                console.error('❌ Public URL Access Failed:', res.status);
            }
        } catch (e) {
            console.error('❌ Fetch Error:', e);
        }

        // Cleanup file
        await supabase.storage.from('public-assets').remove([publicFileName]);
        console.log('✅ Public Cleanup Done');
    }

    // 2. Test Secure Bucket (Authenticated)
    console.log('\n--- Testing secure-docs (Authenticated) ---');
    const secureFileName = `secret-${Date.now()}.txt`;
    const secureContent = 'Top Secret Data';

    const { data: secureUpload, error: secureError } = await supabase.storage
        .from('secure-docs')
        .upload(secureFileName, secureContent);

    if (secureError) {
        console.error('❌ Upload Secure Failed:', secureError);
    } else {
        console.log('✅ Upload Secure Success:', secureUpload?.path);

        // Check Signed URL
        const { data: signedData, error: signedError } = await supabase.storage
            .from('secure-docs')
            .createSignedUrl(secureFileName, 60);

        if (signedError) {
            console.error('❌ Get Signed URL Failed:', signedError);
        } else {
            console.log('ℹ️ Signed URL:', signedData.signedUrl);

            // Validate access
            try {
                const res = await fetch(signedData.signedUrl);
                if (res.ok) {
                    const text = await res.text();
                    if (text === secureContent) console.log('✅ Signed URL Access Confirmed');
                    else console.error('❌ Secure Content Mismatch');
                } else {
                    console.error('❌ Signed URL Access Failed:', res.status);
                }
            } catch (e) { console.error('❌ Fetch Signed Error:', e); }
        }

        // Cleanup
        await supabase.storage.from('secure-docs').remove([secureFileName]);
        console.log('✅ Secure Cleanup Done');
    }

    // Cleanup User (optional) - requires signOut to clean session locally
    await supabase.auth.signOut();
    console.log('\nVerification Complete.');
}

verifyStorage().catch(console.error);
