"use client";

import { useEffect } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
// import { getCategories, createCategory, updateCategory, deleteCategory, Category } from "@/actions/categories";
import { saveCategory, deleteCategory, syncCategories } from "@/lib/db"; // Use local db
import { useCategories } from "@/hooks/use-queries";
import { Category } from "@/lib/store";

export default function CategoriasInsumoPage() {
    // const [categories, setCategories] = useState<Category[]>([]);
    // const [isLoading, setIsLoading] = useState(true);
    const { categories, isLoading } = useCategories("insumo");

    useEffect(() => {
        syncCategories(); // Trigger background sync
    }, []);

    // const loadData = async () => {
    //     setIsLoading(true);
    //     try {
    //         const data = await getCategories("insumo");
    //         setCategories(data);
    //     } catch (error) {
    //         console.error(error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleCreate = async (data: Partial<Category>) => {
        // const created = await createCategory({ ...data, type: "insumo" });
        const created = await saveCategory({ ...data, type: "insumo" });
        return created as Category;
    };

    const handleUpdate = async (id: string, data: Partial<Category>) => {
        // const updated = await updateCategory(id, data);
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
