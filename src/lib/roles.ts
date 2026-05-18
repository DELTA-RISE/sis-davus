import type { UserRole } from "./store";

export const costCenterScopedRoles: UserRole[] = ["gestor", "manager", "operador"];

export function isCostCenterScopedRole(role?: string | null): boolean {
  return !!role && costCenterScopedRoles.includes(role as UserRole);
}

export function getRoleLabel(role?: string | null): string {
  if (role === "admin") return "Administrador";
  if (role === "operador") return "Operador";
  if (role === "manager") return "Gerente";
  if (role === "user") return "Usuario";
  return "Gestor";
}
