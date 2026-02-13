"use client";

import { useEffect, useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { saveCategory, deleteCategory, syncCategories } from "@/lib/db";
import { useCategories } from "@/hooks/use-queries";
import { Category } from "@/lib/store";

export default function CategoriasPatrimonioPage() {
    const { categories, isLoading } = useCategories("patrimonio");

    useEffect(() => {
        syncCategories();
    }, []);

    const handleCreate = async (data: Partial<Category>) => {
        const created = await saveCategory({ ...data, type: "patrimonio" });
        return created as Category;
    };

    const handleUpdate = async (id: string, data: Partial<Category>) => {
        const updated = await saveCategory({ ...data, id });
        return updated as Category;
    }

    const handleDelete = async (id: string) => {
        return await deleteCategory(id);
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando categorias...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Categorias de Patrimônio</h1>
            <CategoryManager
                title="Gerenciar Categorias de Patrimônio"
                initialData={categories}
                createAction={handleCreate}
                updateAction={handleUpdate}
                deleteAction={handleDelete}
            />
        </div>
    );
}
