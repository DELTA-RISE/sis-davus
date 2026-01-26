"use client";

import { useEffect, useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import {
    getInsumosCategories,
    createInsumoCategory,
    updateInsumoCategory,
    deleteInsumoCategory
} from "@/lib/actions/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsumoCategory } from "@/lib/store";
import { toast } from "sonner";

export default function AdminInsumosCategoriesPage() {
    const [categories, setCategories] = useState<InsumoCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getInsumosCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
            toast.error("Erro ao carregar categorias");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Carregando categorias...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Categorias de Insumos (Estoque)</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryManager
                        title="Gerenciar Categorias de Insumos"
                        initialData={categories}
                        createAction={createInsumoCategory}
                        updateAction={updateInsumoCategory}
                        deleteAction={deleteInsumoCategory}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
