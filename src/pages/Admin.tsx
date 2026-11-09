import { useCallback, useEffect, useState } from 'react';
import type { Match, User } from '@/types';
import { matchesService } from '@/services/matchesService';
import { listUsersForAdmin } from '@/services/userService';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';
import { formatDate, formatMatchDate, formatOdd } from '@/utils/formatters';

type Tab = 'matches' | 'users';
const STATUS_LABEL: Record<Match['status'], string> = { scheduled: 'Programado', live: 'En juego', finished: 'Finalizado', suspended: 'Suspendido' };

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-secondary">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'matches') setMatches(await matchesService.getMatches());
      else {
        const r = await listUsersForAdmin();
        setUsers(r.users);
        setPendingUsers(r.pendingEndpoint);
      }
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-page py-8">
      <PageHeader title="Panel administrativo" description="Vista de solo lectura. La gestión (CRUD) se conectará a /admin/* de la API." />
      <Tabs
        label="Secciones"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'matches', label: 'Partidos' },
          { value: 'users', label: 'Usuarios' },
        ]}
      />
      <div className="mt-6" aria-live="polite">
        {loading && <div className="flex justify-center py-16"><Loading /></div>}
        {!loading && error && <ErrorMessage message={error} onRetry={load} />}
        {!loading && !error && tab === 'matches' && (
          matches.length ? (
            <Table head={['Liga', 'Partido', 'Fecha', 'Estado', 'Cuotas 1 / X / 2']}>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-text-secondary">{m.league.name}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{m.homeTeam.name} vs {m.awayTeam.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatMatchDate(m.date)}</td>
                  <td className="px-4 py-3 text-text-secondary">{STATUS_LABEL[m.status]}</td>
                  <td className="px-4 py-3 text-gold">{m.markets[0]?.odds.map((o) => formatOdd(o.value)).join(' / ') ?? '—'}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No hay partidos" />
          )
        )}
        {!loading && !error && tab === 'users' && (
          pendingUsers ? (
            <EmptyState title="Listado de usuarios pendiente" description="La API aún no expone GET /admin/usuarios (ver docs/CONTRATOS-API.md)." />
          ) : users.length ? (
            <Table head={['Nombre', 'Correo', 'Documento', 'Rol', 'Registro']}>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{u.fullName}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.documentId}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.role}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No hay usuarios" />
          )
        )}
      </div>
    </div>
  );
}
