
import { supabase } from "@/lib/supabase";
import { InsumoCategory, PatrimonioCategory } from "@/lib/store";

// Insumos Categories
export async function getInsumosCategories(): Promise<InsumoCategory[]> {
    const { data, error } = await supabase
        .from("insumos_categories")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching insumos categories:", error);
        return [];
    }

    return data as InsumoCategory[];
}

export async function createInsumoCategory(data: Partial<InsumoCategory>) {
    const { data: result, error } = await supabase
        .from("insumos_categories")
        .insert([data])
        .select()
        .single();

    if (error) {
        console.error("Error creating insumo category:", error);
        throw new Error(error.message);
    }

    return result;
}

export async function updateInsumoCategory(id: string, data: Partial<InsumoCategory>) {
    const { data: result, error } = await supabase
        .from("insumos_categories")
        .update(data)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating insumo category:", error);
        throw new Error(error.message);
    }

    return result;
}

export async function deleteInsumoCategory(id: string) {
    const { error } = await supabase
        .from("insumos_categories")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting insumo category:", error);
        throw new Error(error.message);
    }

    return true;
}

// Patrimonios Categories
export async function getPatrimoniosCategories(): Promise<PatrimonioCategory[]> {
    const { data, error } = await supabase
        .from("patrimonios_categories")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching patrimonios categories:", error);
        return [];
    }

    return data as PatrimonioCategory[];
}

export async function createPatrimonioCategory(data: Partial<PatrimonioCategory>) {
    const { data: result, error } = await supabase
        .from("patrimonios_categories")
        .insert([data])
        .select()
        .single();

    if (error) {
        console.error("Error creating patrimonio category:", error);
        throw new Error(error.message);
    }

    return result;
}

export async function updatePatrimonioCategory(id: string, data: Partial<PatrimonioCategory>) {
    const { data: result, error } = await supabase
        .from("patrimonios_categories")
        .update(data)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating patrimonio category:", error);
        throw new Error(error.message);
    }

    return result;
}

export async function deletePatrimonioCategory(id: string) {
    const { error } = await supabase
        .from("patrimonios_categories")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting patrimonio category:", error);
        throw new Error(error.message);
    }

    return true;
}
