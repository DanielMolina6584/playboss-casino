interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, lastPage, total, onChange, disabled }: PaginationProps) {
  if (lastPage <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-5 flex items-center justify-between gap-3 text-sm">
      <span className="text-text-secondary">
        Página {page} de {lastPage} · {total} registros
      </span>
      <div className="flex gap-2">
        <button className="btn-secondary px-4 py-2" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </button>
        <button className="btn-secondary px-4 py-2" disabled={disabled || page >= lastPage} onClick={() => onChange(page + 1)}>
          Siguiente
        </button>
      </div>
    </nav>
  );
}
