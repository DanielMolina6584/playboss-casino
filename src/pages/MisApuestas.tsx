import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Bet, BetStatus, Paginated } from '@/types';
import { betsService } from '@/services/betsService';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { Tabs } from '@/components/common/Tabs';
import { BetCard } from '@/components/bets/BetCard';
import { CancelBetModal } from '@/components/bets/BetParts';

type Tab = 'active' | 'won' | 'lost' | 'all';

const TABS: { value: Tab; label: string }[] = [
  { value: 'active', label: 'Activos' },
  { value: 'won', label: 'Ganados' },
  { value: 'lost', label: 'Perdidos' },
  { value: 'all', label: 'Todos' },
];
const TAB_STATUS: Record<Tab, BetStatus | 'all'> = { active: 'pending', won: 'won', lost: 'lost', all: 'all' };
const EMPTY: Record<Tab, string> = {
  active: 'No tienes apuestas activas.',
  won: 'Aún no has ganado ninguna apuesta.',
  lost: 'No tienes apuestas perdidas.',
  all: 'Todavía no tienes apuestas.',
};

export function MisApuestas() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.value === params.get('estado'))?.value ?? 'active') as Tab;
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Bet> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<Bet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await betsService.getMyBets({ status: TAB_STATUS[tab], page, perPage: 6 }));
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar tu historial de apuestas.');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  function changeTab(next: Tab) {
    setPage(1);
    setParams(next === 'active' ? {} : { estado: next }, { replace: true });
  }

  return (
    <div className="container-page py-8">
      <PageHeader
        title="Mis apuestas"
        description="Consulta tus boletos activos y el historial de resultados."
        action={
          <Link to="/apuestas" className="btn-primary">
            Nueva apuesta
          </Link>
        }
      />

      <Tabs tabs={TABS} value={tab} onChange={changeTab} label="Estado de las apuestas" />

      <div className="mt-6" aria-live="polite">
        {loading && (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-surface space-y-3 p-5">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-4 w-full rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && <ErrorMessage message={error} onRetry={load} />}

        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title={EMPTY[tab]}
            description="Explora los próximos partidos y arma tu cupón."
            action={
              <Link to="/apuestas" className="btn-primary">
                Ver partidos
              </Link>
            }
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.items.map((bet) => (
                <BetCard key={bet.id} bet={bet} onCancel={setToCancel} />
              ))}
            </div>
            <Pagination page={data.page} lastPage={data.lastPage} total={data.total} onChange={setPage} />
          </>
        )}
      </div>

      <CancelBetModal
        bet={toCancel}
        onClose={() => setToCancel(null)}
        onCancelled={() => {
          setToCancel(null);
          load();
        }}
      />
    </div>
  );
}
