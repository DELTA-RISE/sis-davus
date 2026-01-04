"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "date";
  options?: { value: string; label: string }[];
}

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
}

export function AdvancedFilters({ filters, activeFilters, onFilterChange }: AdvancedFiltersProps) {
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    const newFilters: ActiveFilter[] = [];
    Object.entries(tempFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        const config = filters.find((f) => f.key === key);
        newFilters.push({
          key,
          value,
          label: config?.label || key,
        });
      }
    });
    onFilterChange(newFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFilters({});
    onFilterChange([]);
    setIsOpen(false);
  };

  const removeFilter = (key: string) => {
    onFilterChange(activeFilters.filter((f) => f.key !== key));
    setTempFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="font-medium">Filtros Avançados</div>
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label className="text-xs">{filter.label}</Label>
                {filter.type === "select" && filter.options ? (
                  <Select
                    value={tempFilters[filter.key] || ""}
                    onValueChange={(v) => setTempFilters({ ...tempFilters, [filter.key]: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filter.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : filter.type === "number" ? (
                  <Input
                    type="number"
                    className="h-8"
                    value={tempFilters[filter.key] || ""}
                    onChange={(e) => setTempFilters({ ...tempFilters, [filter.key]: e.target.value })}
                  />
                ) : filter.type === "date" ? (
                  <Input
                    type="date"
                    className="h-8"
                    value={tempFilters[filter.key] || ""}
                    onChange={(e) => setTempFilters({ ...tempFilters, [filter.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="h-8"
                    placeholder={`Filtrar por ${filter.label.toLowerCase()}`}
                    value={tempFilters[filter.key] || ""}
                    onChange={(e) => setTempFilters({ ...tempFilters, [filter.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={handleApply} size="sm" className="flex-1">
                Aplicar
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm">
                Limpar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeFilters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="gap-1 pr-1">
          {filter.label}: {filter.value}
          <button
            onClick={() => removeFilter(filter.key)}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
