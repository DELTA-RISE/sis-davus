"use client";

import { useEffect, useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { CategoryPageSkeleton } from "@/components/admin/CategoryPageSkeleton";
import {
    Category,
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "@/actions/categories";

export default function CategoriasInsumoPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCategories("insumo")
            .then(setCategories)
            .finally(() => setIsLoading(false));
    }, []);

    const handleCreate = async (data: Partial<Category>) => {
        return await createCategory({ ...data, type: "insumo" });
    };

    const handleUpdate = async (id: string, data: Partial<Category>) => {
        return await updateCategory(id, { ...data, type: "insumo" });
    };

    const handleDelete = async (id: string) => {
        return await deleteCategory(id);
    };

    if (isLoading) {
        return <CategoryPageSkeleton />;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Categorias de Insumos</h1>
            <CategoryManager
                title="Gerenciar Categorias de Insumos"
                initialData={categories}
                createAction={handleCreate}
                updateAction={handleUpdate}
                deleteAction={handleDelete}
            />
        </div>
    );
}
