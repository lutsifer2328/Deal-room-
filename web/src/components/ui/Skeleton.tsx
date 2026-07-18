'use client';

// Lightweight loading placeholders. Shown instead of spinners while the store
// hydrates, so the page keeps its real layout and content pops in without a
// full-screen "loading" jump. With the localStorage cache these usually flash
// for well under a second (only first-ever visits wait on the network).

export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function DealPageSkeleton() {
    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </div>

            {/* Progress bar */}
            <Skeleton className="h-16 w-full rounded-xl" />

            {/* Task cards */}
            <div className="space-y-4">
                {[0, 1, 2].map(i => (
                    <div key={i} className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 w-2/3">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                            <Skeleton className="h-7 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-64" />
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
            </div>

            {/* Deal rows */}
            <div className="space-y-3">
                {[0, 1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}
