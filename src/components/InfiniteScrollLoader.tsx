"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollLoaderProps {
  hasMore: boolean;
}

export const InfiniteScrollLoader = forwardRef<HTMLDivElement, InfiniteScrollLoaderProps>(
  function InfiniteScrollLoader({ hasMore }, ref) {
    return (
      <div ref={ref} className="flex justify-center py-4">
        {hasMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando mais...</span>
          </div>
        )}
      </div>
    );
  }
);
