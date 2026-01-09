import { UserRole } from '@/lib/store';

interface CreateUserData {
    name: string;
    email: string;
    role: UserRole;
    status: 'ativo' | 'inativo';
}

interface AuditContext {
    userName: string;
    userId: string;
    deviceInfo?: any;
    ip?: string;
}

export async function createUserAction(data: CreateUserData, audit: AuditContext) {
    console.warn("createUserAction: Functionality disabled in Desktop App (requires server).");
    return { success: false, error: "Funcionalidade indisponível na versão Desktop. Use a versão Web para criar usuários." };
}

export async function deleteUserAction(userId: string, audit: AuditContext) {
    console.warn("deleteUserAction: Functionality disabled in Desktop App (requires server).");
    return { success: false, error: "Funcionalidade indisponível na versão Desktop. Use a versão Web para excluir usuários." };
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
    console.warn("updateUserPasswordAction: Functionality disabled in Desktop App (requires server).");
    return { success: false, error: "Funcionalidade indisponível na versão Desktop. Use a versão Web para alterar senhas." };
}
