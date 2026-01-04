"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { toast } from "sonner";

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportJSON: () => void;
  onExportXLSX?: () => void;
  itemCount: number;
}

export function ExportMenu({ onExportCSV, onExportJSON, onExportXLSX, itemCount }: ExportMenuProps) {
  const handleExportCSV = () => {
    onExportCSV();
    toast.success(`${itemCount} itens exportados para CSV`);
  };

  const handleExportJSON = () => {
    onExportJSON();
    toast.success(`${itemCount} itens exportados para JSON`);
  };

  const handleExportXLSX = () => {
    if (onExportXLSX) {
      onExportXLSX();
      toast.success(`${itemCount} itens exportados para Excel`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onExportXLSX && (
          <DropdownMenuItem onClick={handleExportXLSX} className="text-indigo-600 font-medium focus:text-indigo-700 focus:bg-indigo-50">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel (XLSX)
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
