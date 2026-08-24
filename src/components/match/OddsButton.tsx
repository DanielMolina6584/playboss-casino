import { formatOdd } from '@/utils/formatters';
import type { Odd } from '@/types';

interface OddsButtonProps {
  odd: Odd;
  isSelected: boolean;
  onClick: () => void;
}

export function OddsButton({ odd, isSelected, onClick }: OddsButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 transition-all duration-200 active:scale-[0.97] ${
        isSelected
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-border-subtle bg-bg-secondary text-text-primary hover:border-gold/40 hover:bg-white/5'
      }`}
    >
      <span className="text-[11px] font-medium text-text-secondary">{odd.label}</span>
      <span className="text-sm font-bold">{formatOdd(odd.value)}</span>
    </button>
  );
}
