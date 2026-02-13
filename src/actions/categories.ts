"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Note: In a Server Action, we should use the equivalent of createServerComponentClient
// But we can also use the standard client if we handle auth correctly.
// However, typically in Next.js App Router we use:
// import { createClient } from "@/lib/supabase/server"; 
// Since that file didn't exist in my listing, I'll follow the pattern from `auth.ts` 
// which uses `supabaseAdmin` for admin tasks.
// BUT `categories` should simply be accessible by authenticated users (admins/managers).

// Let's check if we can use a standard client that reads cookies.
// Since I don't see a `utils/supabase/server.ts` or similar, I will implement 
// a local client creation logic here using `cookies()`, or simpler:
// Use `supabaseAdmin` if these are strictly admin actions (they seem to be).

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface Category {
    id: string;
    name: string;
    description?: string;
    type: 'insumo' | 'patrimonio';
    created_at?: string;
}

export async function getCategories(type: 'insumo' | 'patrimonio') {
    try {
        const { data, error } = await supabaseAdmin
            .from("categories")
            .select("*")
            .eq("type", type)
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching categories:", error);
            return [];
        }

        return data as Category[];
    } catch (error) {
        console.error("Unexpected error fetching categories:", error);
        return [];
    }
}

export async function createCategory(data: Partial<Category>) {
    try {
        const { data: created, error } = await supabaseAdmin
            .from("categories")
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error("Error creating category:", error);
            throw new Error(error.message);
        }

        return created as Category;
    } catch (error) {
        console.error("Unexpected error creating category:", error);
        throw error;
    }
}

export async function updateCategory(id: string, data: Partial<Category>) {
    try {
        const { data: updated, error } = await supabaseAdmin
            .from("categories")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating category:", error);
            throw new Error(error.message);
        }

        return updated as Category;
    } catch (error) {
        console.error("Unexpected error updating category:", error);
        throw error;
    }
}

export async function deleteCategory(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting category:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Unexpected error deleting category:", error);
        return false;
    }
}
