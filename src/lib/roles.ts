import type { UserRole } from "./store";

export const costCenterScopedRoles: UserRole[] = ["gestor", "manager", "operador"];

export function isCostCenterScopedRole(role?: string | null): boolean {
  return !!role && (costCenterScopedRoles.includes(role as UserRole) || role === "operator");
}

export function isOperatorRole(role?: string | null): boolean {
  return role === "operador" || role === "operator";
}

export function normalizeRole(role?: string | null): UserRole {
  if (role === "operator") return "operador";
  if (role === "admin" || role === "gestor" || role === "operador" || role === "user" || role === "manager") {
    return role;
  }
  return "gestor";
}

export function getRoleLabel(role?: string | null): string {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return "Administrador";
  if (normalizedRole === "operador") return "Operador";
  if (normalizedRole === "manager") return "Gerente";
  if (normalizedRole === "user") return "Usuario";
  return "Gestor";
}
