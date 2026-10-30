import { Link } from 'react-router-dom';
import type { Bet } from '@/types';
import { BetStatusBadge, ResultLabel } from '@/components/bets/BetParts';
import { formatCurrency, formatDateTime, formatOdd } from '@/utils/formatters';

interface BetCardProps {
  bet: Bet;
  onCancel?: (bet: Bet) => void;
  /** Muestra todas las selecciones (detalle) en vez de un resumen enlazado. */
  detailed?: boolean;
}

export function BetCard({ bet, onCancel, detailed }: BetCardProps) {
  const payoutLabel = bet.status === 'won' ? 'Ganado' : bet.status === 'pending' ? 'Pago potencial' : bet.status === 'void' ? 'Devuelto' : 'Pago';
  const payout = bet.status === 'void' ? bet.stake : bet.status === 'lost' ? 0 : bet.potentialWin;

  return (
    <article className="card-surface p-4 sm:p-5" aria-label={`Apuesta ${bet.code}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-text-primary">
            #{bet.code} <span className="ml-1 text-xs font-medium text-text-secondary">{bet.type === 'combo' ? 'Combinada' : 'Simple'}</span>
          </p>
          <p className="text-xs text-text-secondary">{formatDateTime(bet.createdAt)}</p>
        </div>
        <BetStatusBadge status={bet.status} />
      </div>

      <ul className="mt-4 space-y-2">
        {bet.selections.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-bg-secondary px-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate text-text-primary">{s.matchLabel}</p>
              <p className="text-xs text-text-secondary">
                {s.marketName}: <span className="text-text-primary">{s.selectionLabel}</span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-bold text-gold">{formatOdd(s.odd)}</p>
              <ResultLabel result={s.result} />
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border-subtle pt-4 text-sm">
        <div>
          <dt className="text-xs text-text-secondary">Monto</dt>
          <dd className="font-semibold text-text-primary">{formatCurrency(bet.stake)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">Cuota total</dt>
          <dd className="font-semibold text-text-primary">{formatOdd(bet.totalOdds)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-text-secondary">{payoutLabel}</dt>
          <dd className={`font-bold ${bet.status === 'won' ? 'text-emerald-400' : 'text-text-primary'}`}>{formatCurrency(payout)}</dd>
        </div>
      </dl>

      {(!detailed || (bet.cancellable && onCancel)) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {!detailed ? (
            <Link to={`/mis-apuestas/${bet.id}`} className="text-sm font-semibold text-gold hover:text-gold-secondary">
              Ver detalle <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span />
          )}
          {bet.cancellable && onCancel && (
            <button className="btn-secondary px-4 py-2 text-sm" onClick={() => onCancel(bet)}>
              Cancelar apuesta
            </button>
          )}
        </div>
      )}
    </article>
  );
}
