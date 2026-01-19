import { supabase } from "@/lib/supabase";

export async function requestWriteOff(assetId: string, reason: string, userId: string) {
    if (!userId) {
        return { success: false, error: "Unauthorized: Missing User ID" };
    }

    const { error } = await supabase
        .from('write_off_requests')
        .insert({
            asset_id: assetId,
            user_id: userId,
            reason,
            status: 'pending'
        });

    if (error) {
        console.error("Error creating write-off request:", error);
        return { success: false, error: "Failed to create request" };
    }

    return { success: true };
}

export async function approveWriteOff(requestId: string, assetId: string, adminId: string, adminName: string) {
    if (!adminId) {
        return { success: false, error: "Unauthorized: Missing Admin ID" };
    }

    // 1. Update request status
    const { error: updateError } = await supabase
        .from('write_off_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId);

    if (updateError) {
        console.error("Error approving request:", updateError);
        return { success: false, error: "Failed to update request" };
    }

    // 2. Soft Delete the Asset
    const { error: deleteError } = await supabase
        .from('assets')
        .update({
            deleted_at: new Date().toISOString(),
            status: 'Baixado',
            condition: 'Ruim'
        })
        .eq('id', assetId);

    if (deleteError) {
        console.error("Error deleting asset during approval:", deleteError);
        // Note: Transaction support is limited in client SDK without RPC, so we might have inconsistency if this fails after step 1.
        // But for this refactor we accept it.
        return { success: false, error: "Failed to delete asset" };
    }

    // 3. Log activity
    await supabase.from('admin_audit_logs').insert({
        id: crypto.randomUUID(),
        user_id: adminId,
        user_name: adminName,
        action: 'APPROVE_WRITE_OFF',
        resource: 'PATRIMONIO',
        resource_id: assetId,
        details: { requestId, reason: 'Approved write-off request' }
    });

    return { success: true };
}

export async function rejectWriteOff(requestId: string, adminId: string) {
    if (!adminId) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from('write_off_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

    if (error) {
        console.error("Error rejecting request:", error);
        return { success: false, error: "Failed to reject request" };
    }

    return { success: true };
}
