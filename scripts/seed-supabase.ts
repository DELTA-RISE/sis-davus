
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

// Deterministic UUIDs for Cost Centers
const TI_COST_CENTER_ID = 'e8236b28-1111-4444-8888-000000000001'
const OPS_COST_CENTER_ID = 'e8236b28-2222-4444-8888-000000000002'
const RH_COST_CENTER_ID = 'e8236b28-3333-4444-8888-000000000003'
const MKT_COST_CENTER_ID = 'e8236b28-4444-4444-8888-000000000004'

async function seed() {
    console.log('🌱 Starting seed...')

    // 1. Fetch Existing Users
    console.log('Fetching existing users...')
    const { data: users, error: userError } = await supabase.from('profiles').select('id, name, role').limit(5)
    if (userError || !users || users.length === 0) {
        console.warn('⚠️ No existing users found. Stock movements and maintenance tasks requiring user_id will satisfy foreign keys with placeholders if possible, or fail.')
        // In this case, we might need to abort parts of the seed.
        // But we'll try to proceed.
    }

    const adminUser = users?.find(u => u.role === 'admin' || u.role === 'gestor') || users?.[0]

    if (!adminUser) {
        console.error('❌ Critical: Non-empty profiles table required to seed dependent data. Please create a user in the app first.')
        process.exit(1)
    }

    const ADMIN_USER_ID = adminUser.id
    console.log(`Using Admin User: ${adminUser.name} (${ADMIN_USER_ID})`)

    // 2. Cost Centers
    console.log('Creating Cost Centers...')
    const costCentersData = [
        { id: TI_COST_CENTER_ID, name: 'Tecnologia da Informação', code: 'TI-001', status: 'ativo', description: 'Departamento de TI e Infraestrutura' },
        { id: RH_COST_CENTER_ID, name: 'Recursos Humanos', code: 'RH-001', status: 'ativo', description: 'Gestão de Pessoas' },
        { id: OPS_COST_CENTER_ID, name: 'Operações e Logística', code: 'OPS-001', status: 'ativo', description: 'Operações do armazém e frota' },
        { id: MKT_COST_CENTER_ID, name: 'Marketing', code: 'MKT-001', status: 'ativo', description: 'Marketing e Vendas' },
    ]

    const { error: ccError } = await supabase
        .from('cost_centers')
        .upsert(costCentersData, { onConflict: 'id' })

    if (ccError) throw new Error(`Error creating cost centers: ${ccError.message}`)

    // 3. Products
    console.log('Creating Products...')
    const productsData = [
        { name: 'Notebook Dell Latitude 5420', sku: 'DELL-LAT-5420', category: 'Informática', quantity: 15, min_stock: 5, unit_price: 4500.00, location: 'Almoxarifado TI', cost_center: TI_COST_CENTER_ID },
        { name: 'Monitor Dell P2419H', sku: 'DELL-MON-24', category: 'Periféricos', quantity: 20, min_stock: 5, unit_price: 1200.00, location: 'Almoxarifado TI', cost_center: TI_COST_CENTER_ID },
        { name: 'Mouse Logitech MX Master 3', sku: 'LOG-MX3', category: 'Periféricos', quantity: 10, min_stock: 2, unit_price: 450.00, location: 'Almoxarifado TI', cost_center: TI_COST_CENTER_ID },
        { name: 'Cadeira Ergonomica Herman Miller', sku: 'HM-AERON', category: 'Mobiliário', quantity: 5, min_stock: 1, unit_price: 8500.00, location: 'Depósito Geral', cost_center: OPS_COST_CENTER_ID },
        { name: 'Impressora HP LaserJet Pro', sku: 'HP-LJP-400', category: 'Impressão', quantity: 3, min_stock: 1, unit_price: 2100.00, location: 'Almoxarifado TI', cost_center: TI_COST_CENTER_ID },
    ]

    const { data: products, error: prodError } = await supabase
        .from('products')
        .upsert(productsData, { onConflict: 'sku' })
        .select()

    if (prodError) throw new Error(`Error creating products: ${prodError.message}`)

    // 4. Assets
    console.log('Creating Assets...')
    const laptopProduct = products?.find(p => p.sku === 'DELL-LAT-5420')
    const monitorProduct = products?.find(p => p.sku === 'DELL-MON-24')

    // Using 'Bom' exclusively as it was validated.
    const assetsData = [
        {
            name: 'Notebook Dell Latitude #01',
            code: 'ATV-0001',
            condition: 'Bom',
            category: 'Informática',
            model: 'Latitude 5420',
            serial_number: 'CN-0K7-12345',
            location: 'Escritório SP',
            cost_center: TI_COST_CENTER_ID,
        },
        {
            name: 'Notebook Dell Latitude #02',
            code: 'ATV-0002',
            condition: 'Bom',
            category: 'Informática',
            model: 'Latitude 5420',
            serial_number: 'CN-0K7-12346',
            location: 'Almoxarifado TI',
        },
        {
            name: 'Monitor Dell #01',
            code: 'ATV-0003',
            condition: 'Bom',
            category: 'Periféricos',
            model: 'P2419H',
            serial_number: 'CN-MON-111',
            location: 'Escritório SP',
            cost_center: TI_COST_CENTER_ID,
        },
        {
            name: 'Cadeira CEO #01',
            code: 'ATV-0004',
            condition: 'Bom',
            category: 'Mobiliário',
            model: 'Aeron',
            serial_number: 'HM-123-999',
            location: 'Sala de Reparos',
            cost_center: OPS_COST_CENTER_ID,
        },
        {
            name: 'Empilhadeira Elétrica',
            code: 'ATV-0005',
            condition: 'Bom',
            category: 'Maquinário',
            model: 'Toyota 8F',
            serial_number: 'TOY-EMP-888',
            location: 'Galpão Logística',
            cost_center: OPS_COST_CENTER_ID,
        }
    ]

    const { data: assets, error: assetError } = await supabase
        .from('assets')
        .upsert(assetsData, { onConflict: 'code' })
        .select()

    if (assetError) throw new Error(`Error creating assets: ${assetError.message}`)

    // 5. Stock Movements
    console.log('Creating Stock Movements...')
    const movementsData = [
        { type: 'entrada', quantity: 20, product_id: laptopProduct?.id, product_name: laptopProduct?.name, reason: 'Compra Inicial', user_id: ADMIN_USER_ID, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
        { type: 'saida', quantity: 2, product_id: laptopProduct?.id, product_name: laptopProduct?.name, reason: 'Uso Interno', user_id: ADMIN_USER_ID, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
    ]

    if (laptopProduct && monitorProduct) {
        const { error: movError } = await supabase.from('stock_movements').insert(movementsData)
        if (movError) console.warn('Warning creating movements:', movError.message)
    }

    // 6. Maintenance Tasks
    console.log('Creating Maintenance Tasks...')
    // Using specific asset codes to link
    const chairAsset = assets?.find(a => a.code === 'ATV-0004')

    const maintenanceData = []

    if (chairAsset) {
        maintenanceData.push({
            title: 'Troca de pistão a gás',
            description: 'Cadeira não está segurando a altura.',
            asset_id: chairAsset.id,
            asset_name: chairAsset.name,
            asset_code: chairAsset.code,
            priority: 'Média',
            status: 'Em Andamento',
            due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
            cost: 250.00
        })
    }

    if (maintenanceData.length > 0) {
        const { error: maintError } = await supabase.from('maintenance_tasks').insert(maintenanceData)
        if (maintError) console.warn('Warning creating maintenance tasks:', maintError.message)
    }

    console.log('✅ Seed completed successfully!')
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
})
