"use server";

import { UserRole } from '@/lib/store';
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeRole } from '@/lib/roles';

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
    deviceInfo?: Record<string, unknown>;
    ip?: string;
}

export async function createUserAction(data: CreateUserData, _audit: AuditContext): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
    try {
        if (!supabaseAdmin || !supabaseAdmin.auth) {
            return { success: false, error: "Administrative actions are not configured in this environment (Service Role Key missing)." };
        }

        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        const { error } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name: data.name,
                role: normalizeRole(data.role),
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

        // Send Invite Email
        try {
            const { error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
                body: {
                    to: data.email,
                    template_name: 'invite-user',
                    subject: 'Bem-vindo ao SIS DAVUS - Seu Acesso',
                    data: {
                        name: data.name,
                        email: data.email,
                        password: tempPassword,
                        login_url: process.env.NEXT_PUBLIC_APP_URL || 'https://sis.davusengenharia.com.br'
                    }
                }
            });

            if (emailError) {
                console.error("Error sending invite email:", emailError);
                // We don't fail the registration if email fails, but we log it.
            }
        } catch (emailEx) {
            console.error("Exception sending invite email:", emailEx);
        }

        return {
            success: true,
            tempPassword
        };
    } catch (e: unknown) {
        console.error("Unexpected error in createUserAction:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        return { success: false, error: errorMessage };
    }
}


interface DeleteUserOptions {
    audit: AuditContext;
    cleanupConfig?: {
        costCenterStrategy?: 'unassign' | 'reassign';
        newResponsibleId?: string;
    };
}

export async function deleteUserAction(userId: string, options: DeleteUserOptions | AuditContext) {
    // Compatibility with old signature (just AuditContext)
    const config = 'cleanupConfig' in options ? (options as DeleteUserOptions).cleanupConfig : undefined;

    try {
        if (!supabaseAdmin || !supabaseAdmin.auth) {
            return { success: false, error: "Administrative actions are not configured in this environment." };
        }

        // 0. Check for Cost Center Responsibility
        const { count: responsibleCount, error: checkError } = await supabaseAdmin
            .from('cost_centers')
            .select('*', { count: 'exact', head: true })
            .eq('responsible_id', userId);

        if (checkError) {
            console.error("Error checking cost center responsibility:", checkError);
            // Proceed cautiously or fail? Failsafe: let the DB constraint catch it if we can't check.
        }

        if (responsibleCount && responsibleCount > 0) {
            if (!config?.costCenterStrategy) {
                return {
                    success: false,
                    error: "User is responsible for one or more Cost Centers.",
                    code: 'DEPENDENCY_COST_CENTER',
                    details: { responsibleCount }
                };
            }

            // Handle Strategy
            if (config.costCenterStrategy === 'unassign') {
                const { error: updateError } = await supabaseAdmin
                    .from('cost_centers')
                    .update({ responsible_id: null })
                    .eq('responsible_id', userId);

                if (updateError) {
                    return { success: false, error: "Failed to unassign cost centers: " + updateError.message };
                }
            } else if (config.costCenterStrategy === 'reassign' && config.newResponsibleId) {
                const { error: updateError } = await supabaseAdmin
                    .from('cost_centers')
                    .update({ responsible_id: config.newResponsibleId })
                    .eq('responsible_id', userId);

                if (updateError) {
                    return { success: false, error: "Failed to reassign cost centers: " + updateError.message };
                }
            }
        }

        // 1. Cleanup dependencies (Re-enabled per requirements for Cost Center handling, 
        // but user asked to undo the previous general cleanup. 
        // However, if the user is deleted, these constraints might still hit. 
        // The user specifically asked about "Centro de Custo". 
        // I will ONLY handle Cost Center here as requested in the latest prompt.
        // If other tables block, they block (as per "undo" request).
        // Wait, the "undo" was specific to "defaça isso" which removed the generic cleanup.
        // The new request is specific to Cost Center. I will strictly handle Cost Center.)

        // 2. Delete the user
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Error deleting user:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: unknown) {
        console.error("Unexpected error in deleteUserAction:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        return { success: false, error: errorMessage };
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
    } catch (e: unknown) {
        console.error("Unexpected error in updateUserPasswordAction:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        return { success: false, error: errorMessage };
    }
}
