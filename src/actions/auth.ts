'use server'

import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@/lib/store';
import { revalidatePath } from 'next/cache';

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
    try {
        // 1. Create the user in Supabase Auth
        // We generate a fixed temporary password as requested
        const tempPassword = "Davus@Mudar123";

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { name: data.name }
        });

        if (authError) {
            console.error('Error creating auth user:', authError);
            return { success: false, error: authError.message };
        }

        if (!authUser.user) {
            return { success: false, error: 'User creation failed' };
        }

        // 2. Create the profile in the profiles table
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authUser.user.id,
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status,
                must_change_password: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Optional: Delete the auth user if profile creation fails? 
            // For now, we return error so UI knows.
            return { success: false, error: 'Created user but failed to create profile: ' + profileError.message };
        }

        // 3. Create Audit Log
        if (authUser.user) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'CREATE',
                entity: 'USUARIO',
                entity_id: authUser.user.id,
                user_name: audit.userName,
                timestamp: new Date().toISOString(),
                details: `Usuário criado: ${data.name} (${data.email}) - Perfil: ${data.role}`,
                ip: audit.ip || '127.0.0.1',
                device_info: audit.deviceInfo || {},
                user_agent: 'Server Action'
            });
        }

        // 4. Revalidate cache
        revalidatePath('/admin/usuarios');

        return { success: true, tempPassword };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

export async function deleteUserAction(userId: string, audit: AuditContext) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message };
        }

        // Explicitly delete from profiles if cascade doesn't kick in immediately or if we want to be sure
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            action: 'DELETE',
            entity: 'USUARIO',
            entity_id: userId,
            user_name: audit.userName,
            timestamp: new Date().toISOString(),
            details: `Usuário excluído (ID: ${userId})`,
            ip: audit.ip || '127.0.0.1',
            device_info: audit.deviceInfo || {},
            user_agent: 'Server Action'
        });

        revalidatePath('/admin/usuarios');
        return { success: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
            user_metadata: { must_change_password: true }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Force password change on next login
        await supabaseAdmin
            .from('profiles')
            .update({ must_change_password: true })
            .eq('id', userId);

        return { success: true };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred' };
    }
}
