import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading skeleton used by every route's loading.tsx. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-40 w-full" />
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
