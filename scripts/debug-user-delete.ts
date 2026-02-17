import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function run() {
    console.log('🧪 Creating test user...')
    const email = `test-del-3-${Date.now()}@example.com`
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    })

    if (createError || !user) {
        console.error('Failed to create user:', createError)
        return
    }
    console.log(`User created: ${user.id}`)

    // Ensure profile exists
    await supabase.from('profiles').upsert({
        id: user.id,
        name: 'Test Delete User 3',
        email: email,
        role: 'gestor',
        status: 'ativo'
    })

    // Fetch a cost center
    const { data: cc, error: ccError } = await supabase.from('cost_centers').select('id').limit(1).single()
    if (ccError) {
        console.warn('Could not fetch cost center, using product creation might fail if required', ccError)
    }

    // Create a dummy product
    const { data: product, error: prodError } = await supabase.from('products').insert({
        name: 'Test Product ' + Date.now(),
        category: 'Test',
        quantity: 10,
        min_stock: 1,
        unit_price: 10,
        location: 'Test',
        cost_center: cc?.id
    }).select().single()

    if (prodError) {
        console.error('Failed to create product:', prodError)
    } else if (product) {
        console.log('Product created:', product.id)

        console.log('Inserting stock_movement...')
        const { error: movError } = await supabase.from('stock_movements').insert({
            type: 'entrada',
            quantity: 1,
            product_id: product.id,
            product_name: product.name,
            reason: 'Test Delete 3',
            user_id: user.id,
            date: new Date().toISOString()
        })

        if (movError) {
            console.error('Failed to create stock movement:', movError)
        } else {
            console.log('Stock movement created.')
        }
    }

    console.log('Attempting delete...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
        console.error('❌ Delete failed:')
        console.log(JSON.stringify(deleteError, null, 2))
    } else {
        console.log('✅ Delete succeeded (implies NO FK constraint from stock_movements to users)')
    }

    // Cleanup product
    if (product) {
        await supabase.from('products').delete().eq('id', product.id)
    }
}

run().catch(console.error)
