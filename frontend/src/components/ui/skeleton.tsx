import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-gray-200/80", className)} />
);

export const CardSkeleton = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
    <Skeleton className="aspect-video w-full" />
    <Skeleton className="mt-3 h-4 w-2/3" />
    <Skeleton className="mt-2 h-3 w-1/3" />
  </div>
);

export const GridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const RowsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
);
