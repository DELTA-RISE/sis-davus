"use client";

import { HistoryEntry } from "@/hooks/useItemHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Plus,
  Edit,
  Trash2,
  ArrowLeftRight,
  LogOut,
  RotateCcw,
} from "lucide-react";

interface ItemHistoryProps {
  history: HistoryEntry[];
  maxHeight?: string;
}

const actionConfig: Record<
  HistoryEntry["action"],
  { icon: typeof History; color: string; label: string }
> = {
  create: { icon: Plus, color: "text-green-500", label: "Criado" },
  update: { icon: Edit, color: "text-blue-500", label: "Atualizado" },
  delete: { icon: Trash2, color: "text-red-500", label: "Excluído" },
  movement: { icon: ArrowLeftRight, color: "text-amber-500", label: "Movimentação" },
  checkout: { icon: LogOut, color: "text-purple-500", label: "Checkout" },
  return: { icon: RotateCcw, color: "text-teal-500", label: "Devolução" },
};

export function ItemHistory({ history, maxHeight = "300px" }: ItemHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum histórico disponível</p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="space-y-2">
        {history.map((entry) => {
          const config = actionConfig[entry.action];
          const Icon = config.icon;

          return (
            <Card key={entry.id} className="border-border/50 bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{entry.description}</p>
                    {entry.changes.length > 0 && (
                      <div className="mt-2 text-xs space-y-1">
                        {entry.changes.map((change, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            <span className="font-medium">{change.field}:</span>{" "}
                            <span className="line-through text-red-400">{change.old_value ?? "—"}</span>
                            {" → "}
                            <span className="text-green-400">{change.new_value ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      por {entry.user_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
