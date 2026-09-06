import { Skeleton } from "primereact/skeleton";

export function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="mt-6 space-y-3">
      <Skeleton width="12rem" height="1.5rem" />
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="flex gap-2">
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={col} width="3rem" height="3rem" borderRadius="0.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
