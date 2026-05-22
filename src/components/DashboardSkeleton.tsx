"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <div className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen p-4 gap-4">
                <div className="flex items-center gap-3 mb-6">
                    <Skeleton className="h-9 w-9 rounded-lg bg-primary/25" />
                    <Skeleton className="h-6 w-32 bg-slate-300/80 dark:bg-muted" />
                </div>
                <Skeleton className="h-11 w-full rounded-lg bg-slate-300/80 dark:bg-muted" />
                <div className="space-y-2 mt-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg bg-slate-300/70 dark:bg-muted" />
                    ))}
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8">
                <div className="flex justify-between items-center mb-8 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-52 rounded-lg bg-slate-300/80 dark:bg-muted" />
                        <Skeleton className="h-4 w-36 rounded-lg bg-slate-300/70 dark:bg-muted" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl bg-slate-300/80 dark:bg-muted" />
                        <Skeleton className="h-10 w-10 rounded-xl bg-slate-300/80 dark:bg-muted" />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                            <Skeleton className="h-4 w-20 rounded bg-slate-300/70 dark:bg-muted" />
                            <Skeleton className="mt-4 h-8 w-14 rounded bg-slate-300/80 dark:bg-muted" />
                            <Skeleton className="mt-4 h-10 w-10 rounded-xl bg-primary/20" />
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                    <Skeleton className="h-5 w-44 rounded bg-slate-300/80 dark:bg-muted" />
                    <Skeleton className="mt-4 h-72 w-full rounded-xl bg-slate-300/70 dark:bg-muted" />
                </div>
            </div>
        </div>
    );
}
