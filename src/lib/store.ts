// Reconstructed Types based on usage
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  min_stock: number;
  max_stock?: number;
  unit_price?: number;
  location?: string;
  description?: string;
  supplier?: string;
  cost_center?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  location: string;
  condition: 'Novo' | 'Bom' | 'Regular' | 'Ruim' | 'Manutenção';
  status: 'Disponível' | 'Em Uso' | 'Em Manutenção' | 'Baixado';
  purchase_date?: string;
  value?: number;
  model?: string;
  serial_number?: string;
  category?: string;
  assigned_to?: string;
  image_url?: string;
  brand?: string;
  cost_center?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  product_id: string;
  product_name: string;
  reason: string;
  user_id: string;
  user_name?: string;
  cost_center?: string;
  date: string;
  created_at?: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  asset_id: string;
  asset_name: string;
  asset_code?: string;
  due_date: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada';
  priority: 'Baixa' | 'Média' | 'Alta';
  assigned_to?: string;
  cost?: number;
  completed_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Checkout {
  id: string;
  item_id: string;
  item_type: 'product' | 'asset';
  item_name: string;
  user_id: string;
  user_name: string;
  checkout_date: string;
  expected_return_date?: string;
  return_date?: string;
  status: 'Ativo' | 'Devolvido' | 'Atrasado';
  notes?: string;
  created_at?: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  responsible?: string;
  description?: string;
  status: 'ativo' | 'inativo';
  created_at?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  description?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource: string; // Was entity
  resource_id?: string; // Was entity_id
  details: any; // JSONB
  ip_address?: string; // Was ip
  user_agent?: string;
  // Deprecated/Converted fields helper
  user_name?: string;
}

export type UserRole = 'admin' | 'user' | 'manager' | 'gestor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  gravatar_email?: string;
  must_change_password?: boolean;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'ativo' | 'inativo';
  created_at?: string;
  last_login?: string;
}

export interface AssetTimeline {
  id: string;
  asset_id: string;
  date: string;
  title: string;
  description: string;
  type: 'maintenance' | 'assignment' | 'location' | 'status' | 'audit';
  user_name?: string;
  created_at?: string;
}

// Mock Data
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro M3',
    sku: 'MBP-M3-001',
    category: 'Eletrônicos',
    quantity: 2,
    min_stock: 5,
    unit_price: 12000,
    location: 'Depósito Central'
  },
  {
    id: '2',
    name: 'Monitor Dell 27"',
    sku: 'MON-DELL-27',
    category: 'Periféricos',
    quantity: 1,
    min_stock: 3,
    unit_price: 1500,
    location: 'Sala TI'
  },
  {
    id: '3',
    name: 'Teclado Mecânico Keychron',
    sku: 'KEY-K2',
    category: 'Periféricos',
    quantity: 10,
    min_stock: 5,
    unit_price: 600,
    location: 'Almoxarifado'
  }
];

export const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Servidor Dell PowerEdge',
    code: 'PAT-001',
    location: 'Data Center',
    condition: 'Bom',
    status: 'Em Uso',
    category: 'Infraestrutura',
    model: 'R750',
    serial_number: 'SERV-001-X'
  },
  {
    id: '2',
    name: 'Empilhadeira Elétrica',
    code: 'PAT-002',
    location: 'Galpão A',
    condition: 'Manutenção',
    status: 'Em Manutenção',
    category: 'Maquinário',
    model: 'Toyota 8FBE',
    serial_number: 'EMP-2023-99'
  },
  {
    id: '3',
    name: 'Veículo Fiat Fiorino',
    code: 'PAT-003',
    location: 'Estacionamento',
    condition: 'Bom',
    status: 'Disponível',
    category: 'Frota',
    model: 'Endurance 1.4',
    serial_number: 'ABC-1234'
  }
];

export const mockStockMovements: StockMovement[] = [
  {
    id: '1',
    type: 'entrada',
    quantity: 10,
    product_id: '1',
    product_name: 'MacBook Pro M3',
    reason: 'Compra de Estoque',
    user_id: 'admin',
    date: new Date().toISOString()
  },
  {
    id: '2',
    type: 'saida',
    quantity: 2,
    product_id: '3',
    product_name: 'Teclado Mecânico Keychron',
    reason: 'Uso Interno',
    user_id: 'user1',
    date: new Date(Date.now() - 86400000).toISOString()
  }
];

export const mockCheckouts: Checkout[] = [
  {
    id: '1',
    item_id: '1',
    item_type: 'asset',
    item_name: 'Servidor Dell PowerEdge',
    user_id: 'user2',
    user_name: 'João Silva',
    checkout_date: new Date().toISOString(),
    status: 'Ativo'
  }
];
