
// "use server"; // Disabled for Static Export compatibility
// Server Actions are not supported in Next.js Static Export (Electron).
// To restore this functionality, use Supabase Edge Functions.

import { UserRole } from '@/lib/store';
// import { supabaseAdmin } from '@/lib/supabase-admin';
// import { revalidatePath } from 'next/cache';

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

export async function createUserAction(data: CreateUserData, audit: AuditContext): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
    console.warn("createUserAction: Server Actions not supported in Static Export/Electron.");
    return {
        success: false,
        error: "Gerenciamento de usuários requer conexão direta com Backend/Edge Functions. Indisponível na versão Desktop Offline ou Static Export."
    };
}

export async function deleteUserAction(userId: string, audit: AuditContext) {
    console.warn("deleteUserAction: Server Actions not supported in Static Export/Electron.");
    return {
        success: false,
        error: "Gerenciamento de usuários requer conexão direta com Backend/Edge Functions. Indisponível na versão Desktop Offline ou Static Export."
    };
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
    console.warn("updateUserPasswordAction: Server Actions not supported in Static Export/Electron.");
    return {
        success: false,
        error: "Alteração de senha requer conexão direta com Backend/Edge Functions. Indisponível na versão Desktop Offline ou Static Export."
    };
}

