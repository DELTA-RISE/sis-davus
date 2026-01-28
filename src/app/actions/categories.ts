import { supabase } from "@/lib/supabase";
import { InsumoCategory, PatrimonioCategory } from "@/lib/store";

export async function getInsumosCategories(): Promise<InsumoCategory[]> {
    try {
        const { data, error } = await supabase
            .from('insumo_categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching insumo categories:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching insumo categories:', error);
        return [];
    }
}

export async function getPatrimoniosCategories(): Promise<PatrimonioCategory[]> {
    try {
        const { data, error } = await supabase
            .from('patrimonio_categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching patrimonio categories:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching patrimonio categories:', error);
        return [];
    }
}
