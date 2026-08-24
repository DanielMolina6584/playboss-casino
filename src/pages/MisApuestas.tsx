import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Bet, BetStatus } from '@/types';
import { betsService } from '@/services/betsService';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';
import { formatCurrency, formatOdd } from '@/utils/formatters';

const statusConfig: Record<BetStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-gold/15 text-gold' },
  won: { label: 'Ganada', className: 'bg-emerald-500/15 text-emerald-400' },
  lost: { label: 'Perdida', className: 'bg-red-500/15 text-red-400' },
  cashed_out: { label: 'Cobrada', className: 'bg-blue-500/15 text-blue-400' },
};

export function MisApuestas() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBets() {
    setLoading(true);
    setError(null);
    try {
      const data = await betsService.getMyBets();
      setBets(data);
    } catch {
      setError('No fue posible cargar tu historial de apuestas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBets();
  }, []);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Mis apuestas</h1>
      <p className="mt-1 text-sm text-text-secondary">Consulta el historial de tus apuestas realizadas.</p>

      <div className="mt-6">
        {loading && (
          <div className="flex justify-center py-16">
            <Loading label="Cargando tus apuestas..." />
          </div>
        )}

        {!loading && error && <ErrorMessage message={error} onRetry={loadBets} />}

        {!loading && !error && bets.length === 0 && (
          <EmptyState
            title="Todavía no tienes apuestas"
            description="Explora los próximos partidos y arma tu primer cupón."
            action={
              <Link to="/apuestas" className="btn-primary">
                Ver partidos
              </Link>
            }
          />
        )}

        {!loading && !error && bets.length > 0 && (
          <div className="space-y-3">
            {bets.map((bet) => (
              <div key={bet.id} className="card-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-text-secondary">
                    {new Date(bet.createdAt).toLocaleString('es-CO')}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[bet.status].className}`}>
                    {statusConfig[bet.status].label}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {bet.selections.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">
                        {s.matchLabel} — <span className="text-text-secondary">{s.selectionLabel}</span>
                      </span>
                      <span className="font-medium text-gold">{formatOdd(s.odd)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-sm">
                  <span className="text-text-secondary">
                    Monto: <span className="text-text-primary">{formatCurrency(bet.stake)}</span> · Cuota total:{' '}
                    <span className="text-text-primary">{formatOdd(bet.totalOdds)}</span>
                  </span>
                  <span className="font-semibold text-text-primary">
                    Ganancia: {formatCurrency(bet.potentialWin)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
