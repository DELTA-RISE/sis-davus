import { isCostCenterScopedRole } from "./roles";

const NO_COST_CENTER_SCOPE = "__sis_davus_no_cost_center__";

export function getScopedCostCenter(role?: string | null, costCenter?: string | null): string | null {
  if (!isCostCenterScopedRole(role)) return null;
  return costCenter || NO_COST_CENTER_SCOPE;
}

export function belongsToCostCenter(itemCostCenter?: string | null, scopedCostCenter?: string | null): boolean {
  if (!scopedCostCenter) return true;
  return itemCostCenter === scopedCostCenter;
}
