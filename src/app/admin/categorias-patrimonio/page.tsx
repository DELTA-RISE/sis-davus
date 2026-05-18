"use client";

import { useEffect, useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import {
    Category,
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "@/actions/categories";

export default function CategoriasPatrimonioPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCategories("patrimonio")
            .then(setCategories)
            .finally(() => setIsLoading(false));
    }, []);

    const handleCreate = async (data: Partial<Category>) => {
        return await createCategory({ ...data, type: "patrimonio" });
    };

    const handleUpdate = async (id: string, data: Partial<Category>) => {
        return await updateCategory(id, { ...data, type: "patrimonio" });
    };

    const handleDelete = async (id: string) => {
        return await deleteCategory(id);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando categorias...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Categorias de Patrimonio</h1>
            <CategoryManager
                title="Gerenciar Categorias de Patrimonio"
                initialData={categories}
                createAction={handleCreate}
                updateAction={handleUpdate}
                deleteAction={handleDelete}
            />
        </div>
    );
}
