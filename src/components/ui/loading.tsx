"use client";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizes[size]} border-2 border-card-border border-t-brand-blue rounded-full animate-spin`}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="p-6">
      <div className="h-8 w-48 bg-card-border rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-72 bg-card-border rounded animate-pulse mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-card-border rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-card-border rounded-xl animate-pulse" />
    </div>
  );
}

export function TableLoading({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-6 bg-card-border rounded animate-pulse flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-10 bg-surface rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
