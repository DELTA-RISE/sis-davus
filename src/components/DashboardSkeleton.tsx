"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex flex-col w-64 border-r border-border h-screen p-4 gap-4">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="space-y-2 mt-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-96 rounded-xl" />
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>

                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    );
}
