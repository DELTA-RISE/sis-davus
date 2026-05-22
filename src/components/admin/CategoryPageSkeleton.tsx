import { Skeleton } from "@/components/ui/skeleton";

export function CategoryPageSkeleton() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
            <div className="mb-6">
                <Skeleton className="h-9 w-72" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-9 w-36" />
                </div>

                <Skeleton className="h-10 w-full max-w-sm" />

                <div className="rounded-md border border-border bg-card">
                    <div className="grid grid-cols-[1fr_1.5fr_100px] gap-4 border-b border-border p-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16 justify-self-end" />
                    </div>
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="grid grid-cols-[1fr_1.5fr_100px] gap-4 border-b border-border/60 p-4 last:border-b-0">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-4 w-full max-w-md" />
                            <div className="flex justify-end gap-2">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
