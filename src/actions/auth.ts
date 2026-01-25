import { UserRole } from '@/lib/store';
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    try {
        if (!supabaseAdmin || !supabaseAdmin.auth) {
            return { success: false, error: "Administrative actions are not configured in this environment (Service Role Key missing)." };
        }

        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name: data.name,
                role: data.role,
                status: data.status,
                cost_center: data.cost_center
            }
        });

        if (error) {
            console.error("Error creating user:", error);
            return { success: false, error: error.message };
        }

        // We successfully created the user in Auth. 
        // Note: The profile creation usually happens via a database trigger on auth.users insert.
        // If not, we would need to manually insert into public.profiles here.

        return {
            success: true,
            tempPassword
        };
    } catch (e: any) {
        console.error("Unexpected error in createUserAction:", e);
        return { success: false, error: e.message || "Unknown error" };
    }
}

export async function deleteUserAction(userId: string, audit: AuditContext) {
    try {
        if (!supabaseAdmin || !supabaseAdmin.auth) {
            return { success: false, error: "Administrative actions are not configured in this environment." };
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Error deleting user:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        console.error("Unexpected error in deleteUserAction:", e);
        return { success: false, error: e.message || "Unknown error" };
    }
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
    try {
        if (!supabaseAdmin || !supabaseAdmin.auth) {
            return { success: false, error: "Administrative actions are not configured in this environment." };
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (error) {
            console.error("Error updating password:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        console.error("Unexpected error in updateUserPasswordAction:", e);
        return { success: false, error: e.message || "Unknown error" };
    }
}
