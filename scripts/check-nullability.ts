
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
    console.log('Checking stock_movements user_id nullability...')

    // Fetch a cost center to create product
    const { data: cc } = await supabase.from('cost_centers').select('id').limit(1).single()

    // Create dummy product
    const { data: product, error: prodError } = await supabase.from('products').insert({
        name: 'Test Product Null ' + Date.now(),
        category: 'Test',
        quantity: 10,
        min_stock: 1,
        unit_price: 10,
        location: 'Test',
        cost_center: cc?.id
    }).select().single()

    if (prodError) {
        console.error('Failed to create product:', prodError)
        return
    }

    if (product) {
        console.log('Product created:', product.id)

        console.log('Inserting stock_movement with NULL user_id...')
        const { error: movError } = await supabase.from('stock_movements').insert({
            type: 'entrada',
            quantity: 1,
            product_id: product.id,
            product_name: product.name,
            reason: 'Test Null',
            user_id: null,
            date: new Date().toISOString()
        })

        if (movError) {
            console.log(`stock_movements user_id NULL failed: ${movError.message}`)
        } else {
            console.log('stock_movements user_id CAN BE NULL')
        }

        // Cleanup
        await supabase.from('products').delete().eq('id', product.id)
    }
}

run().catch(console.error)
