import { useCallback, useEffect, useState } from 'react';
import type { Match } from '@/types';
import { matchesService } from '@/services/matchesService';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';
import { AdminTable } from '@/components/admin/AdminTable';
import { UsersAdmin } from '@/components/admin/UsersAdmin';
import { WithdrawalsAdmin } from '@/components/admin/WithdrawalsAdmin';
import { formatMatchDate, formatOdd } from '@/utils/formatters';

type Tab = 'matches' | 'users' | 'withdrawals';
const STATUS_LABEL: Record<Match['status'], string> = { scheduled: 'Programado', live: 'En juego', finished: 'Finalizado', suspended: 'Suspendido' };

function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMatches(await matchesService.getMatches());
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar los partidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!matches.length) return <EmptyState title="No hay partidos" />;
  return (
    <AdminTable head={['Liga', 'Partido', 'Fecha', 'Estado', 'Cuotas 1 / X / 2']}>
      {matches.map((m) => (
        <tr key={m.id}>
          <td className="px-4 py-3 text-text-secondary">{m.league.name}</td>
          <td className="px-4 py-3 font-medium text-text-primary">{m.homeTeam.name} vs {m.awayTeam.name}</td>
          <td className="px-4 py-3 text-text-secondary">{formatMatchDate(m.date)}</td>
          <td className="px-4 py-3 text-text-secondary">{STATUS_LABEL[m.status]}</td>
          <td className="px-4 py-3 text-gold">{m.markets[0]?.odds.map((o) => formatOdd(o.value)).join(' / ') ?? '—'}</td>
        </tr>
      ))}
    </AdminTable>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('withdrawals');
  return (
    <div className="container-page py-8">
      <PageHeader title="Panel administrativo" description="Retiros, usuarios y partidos. El CRUD de catálogo (/admin/equipos, ligas, mercados...) aún no está en la interfaz." />
      <Tabs
        label="Secciones"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'withdrawals', label: 'Retiros' },
          { value: 'users', label: 'Usuarios' },
          { value: 'matches', label: 'Partidos' },
        ]}
      />
      <div className="mt-6">
        {tab === 'withdrawals' && <WithdrawalsAdmin />}
        {tab === 'users' && <UsersAdmin />}
        {tab === 'matches' && <MatchesTab />}
      </div>
    </div>
  );
}
