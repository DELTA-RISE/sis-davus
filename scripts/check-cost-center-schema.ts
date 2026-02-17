
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
    console.log('Checking cost_centers schema...')

    // Attempt to select responsible_id from cost_centers
    const { data, error } = await supabase.from('cost_centers').select('id, name, responsible_id').limit(1)

    if (error) {
        console.error('Error selecting responsible_id:', error.message)
    } else {
        console.log('Success! responsible_id column exists.')
        console.log('Sample data:', data)
    }

    // Also check if we can identify if a user is a responsible
}

run().catch(console.error)
