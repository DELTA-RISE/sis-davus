"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Category {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
}

interface CategoryManagerProps<T extends Category> {
    title: string;
    initialData: T[];
    createAction: (data: Partial<T>) => Promise<T>;
    updateAction: (id: string, data: Partial<T>) => Promise<T>;
    deleteAction: (id: string) => Promise<boolean>;
}

export function CategoryManager<T extends Category>({
    title,
    initialData,
    createAction,
    updateAction,
    deleteAction,
}: CategoryManagerProps<T>) {
    const [data, setData] = useState<T[]>(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Partial<T>>({});
    const [isLoading, setIsLoading] = useState(false);

    const filteredData = data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenNew = () => {
        setEditingItem(null);
        setFormData({});
        setIsDialogOpen(true);
    };

    const handleEdit = (item: T) => {
        setEditingItem(item);
        setFormData(item);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            toast.error("Nome é obrigatório");
            return;
        }

        setIsLoading(true);
        try {
            if (editingItem) {
                const updated = await updateAction(editingItem.id, formData);
                setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                toast.success("Categoria atualizada com sucesso!");
            } else {
                const created = await createAction(formData);
                setData((prev) => [created, ...prev]);
                toast.success("Categoria criada com sucesso!");
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Erro ao salvar categoria");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

        try {
            await deleteAction(id);
            setData((prev) => prev.filter((item) => item.id !== id));
            toast.success("Categoria excluída com sucesso!");
        } catch (error) {
            toast.error("Erro ao excluir categoria");
            console.error(error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <Button onClick={handleOpenNew} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar categorias..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    Nenhuma categoria encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.description || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Informática"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ""}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descrição opcional..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
