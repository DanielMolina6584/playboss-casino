import type { BetSelection } from '@/types';
import { formatOdd } from '@/utils/formatters';

export function BetSlipItem({ selection, onRemove }: { selection: BetSelection; onRemove: () => void }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{selection.matchLabel}</p>
        <button
          onClick={onRemove}
          aria-label="Quitar selección"
          className="shrink-0 text-text-secondary transition-colors hover:text-red-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-xs text-text-secondary">{selection.marketName}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-text-primary">{selection.selectionLabel}</span>
        <span className="text-sm font-bold text-gold">{formatOdd(selection.odd)}</span>
      </div>
    </div>
  );
}
