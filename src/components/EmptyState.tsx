"use client";

import { Package, FileX, Search, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type?: "search" | "noData" | "filtered";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  search: Search,
  noData: Inbox,
  filtered: FileX,
};

export function EmptyState({ type = "noData", title, description, action }: EmptyStateProps) {
  const Icon = icons[type];
  
  const defaultContent = {
    search: {
      title: "Nenhum resultado encontrado",
      description: "Tente buscar com outros termos",
    },
    noData: {
      title: "Nenhum item cadastrado",
      description: "Comece adicionando um novo item",
    },
    filtered: {
      title: "Nenhum item corresponde aos filtros",
      description: "Tente ajustar os filtros aplicados",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {title || defaultContent[type].title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description || defaultContent[type].description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
