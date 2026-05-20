import type { UserRole } from "./store";

export const costCenterScopedRoles: UserRole[] = ["gestor", "manager", "operador"];

export function isCostCenterScopedRole(role?: string | null): boolean {
  return !!role && (costCenterScopedRoles.includes(role as UserRole) || role === "operator");
}

export function isOperatorRole(role?: string | null): boolean {
  return role === "operador" || role === "operator";
}

export function getRoleLabel(role?: string | null): string {
  if (role === "admin") return "Administrador";
  if (isOperatorRole(role)) return "Operador";
  if (role === "manager") return "Gerente";
  if (role === "user") return "Usuario";
  return "Gestor";
}
