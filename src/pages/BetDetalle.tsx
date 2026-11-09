import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Bet } from '@/types';
import { betsService } from '@/services/betsService';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';
import { BetCard } from '@/components/bets/BetCard';
import { CancelBetModal } from '@/components/bets/BetParts';

export function BetDetalle() {
  const { id = '' } = useParams();
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBet(await betsService.getBet(id));
    } catch (err) {
      const e = err as { message?: string; status?: number };
      setError({ message: e.message ?? 'No fue posible cargar la apuesta.', status: e.status });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title="Detalle de la apuesta" backTo={{ to: '/mis-apuestas', label: 'Mis apuestas' }} />
      {loading && (
        <div className="flex justify-center py-16">
          <Loading label="Cargando apuesta…" />
        </div>
      )}
      {!loading && error?.status === 404 && (
        <EmptyState
          title="No encontramos esta apuesta"
          description="Puede que no exista o que pertenezca a otra cuenta."
          action={<Link to="/mis-apuestas" className="btn-primary">Ver mis apuestas</Link>}
        />
      )}
      {!loading && error && error.status !== 404 && <ErrorMessage message={error.message} onRetry={load} />}
      {!loading && bet && <BetCard bet={bet} detailed onCancel={() => setCancelling(true)} />}
      <CancelBetModal
        bet={cancelling ? bet : null}
        onClose={() => setCancelling(false)}
        onCancelled={(b) => {
          setCancelling(false);
          setBet(b);
        }}
      />
    </div>
  );
}
