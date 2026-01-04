"use client";

import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

export function PullToRefresh({ isRefreshing, pullDistance, threshold }: PullToRefreshProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = isRefreshing ? 0 : progress * 180;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 transition-opacity"
      style={{
        opacity: isRefreshing ? 1 : progress,
        transform: `translateX(-50%) translateY(${Math.min(pullDistance, threshold + 20)}px)`,
      }}
    >
      <div className="bg-card border border-border rounded-full p-3 shadow-lg">
        <RefreshCw
          className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
    </div>
  );
}
