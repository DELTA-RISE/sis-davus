import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sku: z.string().min(3, "SKU deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  min_stock: z.number().min(0, "Estoque mínimo não pode ser negativo"),
  max_stock: z.number().min(1, "Estoque máximo deve ser maior que 0"),
  location: z.string().optional(),
  unit_of_measure: z.string().optional(),
  unit_price: z.number().min(0, "Preço não pode ser negativo"),
  cost_center: z.string().min(1, "Selecione um centro de custo"),
});

export const movementSchema = z.object({
  product_id: z.string().min(1, "Selecione um produto"),
  type: z.enum(["entrada", "saida"]),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  reason: z.string().min(3, "Informe o motivo"),
  cost_center: z.string().optional(),
});

export const assetSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  code: z.string().min(3, "Código deve ter pelo menos 3 caracteres"),
  category: z.string().optional().default(""),
  location: z.string().optional().default(""),
  cost_center: z.string().optional().default(""),
  condition: z.enum(["Excelente", "Bom", "Regular", "Ruim", "Manutenção"]),
  purchase_date: z.string().optional(),
  value: z.number().min(0, "Valor não pode ser negativo"),
  invoice_number: z.string().optional(),
  warranty_months: z.number().min(0, "Garantia não pode ser negativa").optional(),
  assigned_to: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
});

export const checkoutSchema = z.object({
  item_type: z.enum(["product", "asset"]),
  item_id: z.string().min(1, "Selecione um item"),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  user_name: z.string().min(2, "Informe o usuário"),
  expected_return: z.string().min(1, "Informe a data de devolução"),
  notes: z.string().optional(),
});

export const maintenanceSchema = z.object({
  asset_id: z.string().min(1, "Selecione um patrimônio"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  priority: z.enum(["baixa", "media", "alta", "urgente"]),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type MovementFormData = z.infer<typeof movementSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "gestor", "operador", "user", "manager"]),
  status: z.enum(["ativo", "inativo"]),
  cost_center: z.string().nullable().optional(), // Can be null for admins or if not assigned
});

export const costCenterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  responsible_id: z.string().optional(), // ID of the responsible user
  responsible: z.string().optional(), // Name of the responsible user (legacy/denormalized)
  status: z.enum(["ativo", "inativo"]),
  description: z.string().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
export type CostCenterFormData = z.infer<typeof costCenterSchema>;
