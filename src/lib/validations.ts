import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sku: z.string().min(3, "SKU deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  min_stock: z.number().min(0, "Estoque mínimo não pode ser negativo"),
  max_stock: z.number().min(1, "Estoque máximo deve ser maior que 0"),
  location: z.string().min(1, "Informe a localização"),
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
  category: z.string().min(1, "Selecione uma categoria"),
  location: z.string().min(1, "Informe a localização"),
  cost_center: z.string().min(1, "Selecione um centro de custo"),
  condition: z.enum(["Excelente", "Bom", "Regular", "Ruim", "Manutenção"]),
  acquisition_date: z.string().min(1, "Informe a data de aquisição"),
  value: z.number().min(0, "Valor não pode ser negativo"),
  responsible: z.string().min(2, "Informe o responsável"),
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
