"use client";

import { useEffect, useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import {
    getPatrimoniosCategories,
    createPatrimonioCategory,
    updatePatrimonioCategory,
    deletePatrimonioCategory
} from "@/lib/actions/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatrimonioCategory } from "@/lib/store";
import { toast } from "sonner";

export default function AdminPatrimoniosCategoriesPage() {
    const [categories, setCategories] = useState<PatrimonioCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getPatrimoniosCategories();
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
                    <CardTitle>Categorias de Patrimônio</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryManager
                        title="Gerenciar Categorias de Patrimônio"
                        initialData={categories}
                        createAction={createPatrimonioCategory}
                        updateAction={updatePatrimonioCategory}
                        deleteAction={deletePatrimonioCategory}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
