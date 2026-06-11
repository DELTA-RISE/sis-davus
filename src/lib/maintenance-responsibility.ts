import { MaintenanceTask, User } from "@/lib/store";

export const MAINTENANCE_RESPONSIBLE_DEPARTMENT = "matriz_manutencao";
export const MAINTENANCE_RESPONSIBLE_LABEL = "Responsável pela manutenção";

export const canBeMaintenanceResponsible = (user?: Pick<User, "role"> | null) =>
  user?.role === "gestor" || user?.role === "operador";

export const isMaintenanceResponsible = (user?: Pick<User, "department"> | null) =>
  user?.department === MAINTENANCE_RESPONSIBLE_DEPARTMENT;

export const findMaintenanceResponsible = (users: User[]) =>
  users.find((user) => isMaintenanceResponsible(user) && canBeMaintenanceResponsible(user)) || null;

export const matchesUserIdentity = (
  user: { id?: string | null; email?: string | null; name?: string | null },
  value?: string | null
) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return false;

  return [user.id, user.email, user.name]
    .filter(Boolean)
    .some((candidate) => String(candidate).trim().toLowerCase() === normalizedValue);
};

export const getUserDisplayName = (users: User[], value?: string | null) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return "";

  const found = users.find((user) =>
    [user.id, user.email, user.name]
      .filter(Boolean)
      .some((candidate) => String(candidate).trim().toLowerCase() === normalizedValue)
  );

  return found?.name || value || "";
};

export const canManageMaintenanceTask = (
  currentUser: { id?: string | null; email?: string | null; name?: string | null },
  task: Pick<MaintenanceTask, "assigned_to">
) => matchesUserIdentity(currentUser, task.assigned_to);
