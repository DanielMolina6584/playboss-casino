export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-text-secondary">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="card-surface p-4">
      <div className="skeleton mb-3 h-3 w-24 rounded" />
      <div className="flex items-center justify-between gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="skeleton h-3 flex-1 rounded" />
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="skeleton h-10 rounded-lg" />
        <div className="skeleton h-10 rounded-lg" />
        <div className="skeleton h-10 rounded-lg" />
      </div>
    </div>
  );
}
