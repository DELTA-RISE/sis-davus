import { UserRole } from '@/lib/store';

interface CreateUserData {
    name: string;
    email: string;
    role: UserRole;
    status: 'ativo' | 'inativo';
    cost_center: string | null;
}

interface AuditContext {
    userName: string;
    userId: string;
    deviceInfo?: any;
    ip?: string;
}

export async function createUserAction(data: CreateUserData, audit: AuditContext): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
    console.warn("createUserAction called in client/static mode. This feature requires a backend.");
    return {
        success: false,
        error: "A criação de usuários via Sincronização não é suportada na versão Local/Estática. Por favor use o painel do Supabase."
    };
}

export async function deleteUserAction(userId: string, audit: AuditContext) {
    console.warn("deleteUserAction called in client/static mode");
    return {
        success: false,
        error: "A exclusão de usuários não é suportada na versão Local/Estática."
    };
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
    console.warn("updateUserPasswordAction called in client/static mode");
    return {
        success: false,
        error: "A alteração de senha de outros usuários não é suportada na versão Local/Estática."
    };
}
