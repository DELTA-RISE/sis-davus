export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  location: string;
  cost_center: string;
  unit_price: number;
  last_updated: string;
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  location: string;
  cost_center: string;
  condition: 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Manutenção';
  acquisition_date: string;
  value: number;
  responsible: string;
  description: string;
  brand?: string;
  model?: string;
  serial_number?: string;
}

export interface MaintenanceTask {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_code: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'aguardando_peca' | 'concluido';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  created_at: string;
  updated_at: string;
  due_date?: string;
  assigned_to?: string;
  notes?: string;
}

export interface AssetTimeline {
  id: string;
  asset_id: string;
  type: 'criacao' | 'movimentacao' | 'manutencao' | 'checkout' | 'devolucao' | 'atualizacao';
  title: string;
  description: string;
  date: string;
  user_name: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'entrada' | 'saida';
  quantity: number;
  date: string;
  reason: string;
  user_name: string;
  cost_center: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  gravatar_email?: string;
  role: 'admin' | 'gestor';
  status: 'ativo' | 'inativo';
  created_at?: string;
  last_login?: string;
  must_change_password?: boolean;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  responsible: string;
  status: 'ativo' | 'inativo';
}

export interface StorageLocation {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'almoxarifado' | 'deposito' | 'sala' | 'externo';
  capacity: number;
  current_occupation: number;
  status: 'ativo' | 'inativo';
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  user_name: string;
  timestamp: string;
  details: string;
  ip: string;
  user_agent?: string;
  device_info?: {
    os: string;
    browser: string;
    device: string;
  };
}

export interface Checkout {
  id: string;
  item_type: 'product' | 'asset';
  item_id: string;
  item_name: string;
  quantity: number;
  user_name: string;
  checkout_date: string;
  expected_return: string;
  return_date: string | null;
  status: 'em_uso' | 'devolvido' | 'atrasado';
  notes: string;
}

export type UserRole = 'admin' | 'gestor';

export const mockAssets: Asset[] = [
  {
    id: "660e8400-e29b-41d4-a716-446655440000",
    name: "MacBook Pro 14\"",
    code: "PAT-001",
    category: "Informática",
    location: "Sede - Escritório 1",
    cost_center: "TI",
    condition: "Excelente",
    acquisition_date: "2023-01-15",
    value: 12500,
    responsible: "Ana Souza",
    description: "MacBook Pro M2, 16GB RAM, 512GB SSD",
    brand: "Apple",
    model: "M2 Pro",
    serial_number: "SN12345678",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Monitor Dell 27\"",
    code: "PAT-002",
    category: "Informática",
    location: "Sede - Escritório 2",
    cost_center: "Financeiro",
    condition: "Bom",
    acquisition_date: "2022-05-20",
    value: 2800,
    responsible: "Carlos Lima",
    description: "Monitor UltraSharp 4K",
    brand: "Dell",
    model: "U2723QE",
    serial_number: "SN87654321",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    name: "Furadeira Industrial",
    code: "PAT-003",
    category: "Ferramentas",
    location: "Oficina Central",
    cost_center: "Manutenção",
    condition: "Bom",
    acquisition_date: "2021-11-10",
    value: 1500,
    responsible: "Ricardo Silva",
    description: "Furadeira de impacto de alta performance",
    brand: "Bosch",
    model: "GSB 16 RE",
    serial_number: "SN11223344",
  }
];

export const mockAssetTimelines: AssetTimeline[] = [
  {
    id: "1",
    asset_id: "660e8400-e29b-41d4-a716-446655440000",
    type: "criacao",
    title: "Patrimônio Cadastrado",
    description: "Cadastrado inicialmente no sistema",
    date: "2023-01-15T09:00:00Z",
    user_name: "Sistema",
  },
  {
    id: "2",
    asset_id: "660e8400-e29b-41d4-a716-446655440002",
    type: "manutencao",
    title: "Troca de escovas",
    description: "Manutenção preventiva realizada",
    date: "2023-06-10T14:30:00Z",
    user_name: "Ricardo Silva",
  }
];

export const mockMaintenanceTasks: MaintenanceTask[] = [
  {
    id: "1",
    asset_id: "660e8400-e29b-41d4-a716-446655440002",
    asset_name: "Furadeira Industrial",
    asset_code: "PAT-003",
    title: "Revisão Periódica",
    description: "Verificar motor e cabos",
    status: "concluido",
    priority: "media",
    created_at: "2023-06-05T10:00:00Z",
    updated_at: "2023-06-10T16:00:00Z",
    due_date: "2023-06-12",
    assigned_to: "Ricardo Silva",
  }
];

export const mockCheckouts: Checkout[] = [
  {
    id: "1",
    item_type: "asset",
    item_id: "660e8400-e29b-41d4-a716-446655440000",
    item_name: "MacBook Pro 14\"",
    quantity: 1,
    user_name: "Ana Souza",
    checkout_date: "2023-01-20T08:00:00Z",
    expected_return: "2026-12-31T18:00:00Z",
    return_date: null,
    status: "em_uso",
    notes: "Notebook de trabalho",
  }
];

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Cabo HDMI 2m",
    sku: "INF-001",
    category: "Cabos",
    quantity: 45,
    min_stock: 10,
    max_stock: 100,
    location: "Prateleira A1",
    cost_center: "TI",
    unit_price: 35.50,
    last_updated: "2023-12-01",
  }
];

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@davus.com",
    role: "admin",
    status: "ativo",
  }
];

export const mockCostCenters: CostCenter[] = [
  {
    id: "1",
    code: "001",
    name: "TI",
    description: "Departamento de Tecnologia",
    responsible: "Ana Souza",
    status: "ativo",
  }
];

export const mockLocations: StorageLocation[] = [
  {
    id: "1",
    code: "LOC-001",
    name: "Sede - Escritório 1",
    description: "Prédio principal",
    type: "sala",
    capacity: 100,
    current_occupation: 25,
    status: "ativo",
  }
];

