import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AccountMovement, AccountMovementType, Paginated } from '@/types';
import { walletService, movementLabels } from '@/services/walletService';
import { useWallet } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

const PER_PAGE = 8;

const SIGN: Record<AccountMovementType, 1 | -1 | 0> = {
  deposit: 1,
  winnings: 1,
  bet_released: 1,
  withdrawal: -1,
  bet_reserved: -1,
  bet_lost: 0,
};

function MovementRow({ m }: { m: AccountMovement }) {
  const sign = SIGN[m.type];
  const color = sign > 0 ? 'text-emerald-400' : sign < 0 ? 'text-text-primary' : 'text-text-secondary';
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{movementLabels[m.type]}</p>
        <p className="truncate text-xs text-text-secondary">
          {m.description} · {formatDateTime(m.createdAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${color}`}>
          {sign > 0 ? '+' : sign < 0 ? '−' : ''}
          {formatCurrency(m.amount)}
        </p>
        <p className="text-xs text-text-secondary">Saldo {formatCurrency(m.availableBalanceAfter)}</p>
      </div>
    </li>
  );
}

export function Billetera() {
  const { account, loading: balanceLoading, error: balanceError, refresh } = useWallet();
  const [type, setType] = useState<AccountMovementType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AccountMovement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await walletService.getMovements({ type, from, to, page, perPage: PER_PAGE }));
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar tus movimientos.');
    } finally {
      setLoading(false);
    }
  }, [type, from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  const invalidRange = !!from && !!to && from > to;
  const hasFilters = !!(type || from || to);

  return (
    <div className="container-page py-8">
      <PageHeader title="Mi billetera" description="Tu saldo y el historial de movimientos." />

      <section aria-label="Saldo" className="card-surface relative isolate overflow-hidden p-5 sm:p-7">
        <img src="/assets/illustrations/pattern-gold.svg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-10" />
        {balanceError ? (
          <ErrorMessage message={balanceError} onRetry={refresh} />
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Saldo disponible</p>
              {balanceLoading && !account ? (
                <div className="skeleton mt-2 h-10 w-48 rounded" />
              ) : (
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-text-primary">
                  {formatCurrency(account?.availableBalance ?? 0)}
                </p>
              )}
              <p className="mt-2 text-sm text-text-secondary">
                En apuestas activas: <span className="text-text-primary">{formatCurrency(account?.heldBalance ?? 0)}</span>
              </p>
            </div>
            <div className="flex w-full gap-3 sm:w-auto">
              <Link to="/billetera/recarga" className="btn-primary flex-1 sm:flex-none">
                Recargar
              </Link>
              <Link to="/billetera/retiro" className="btn-secondary flex-1 sm:flex-none">
                Retirar
              </Link>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="mov-title" className="mt-8">
        <h2 id="mov-title" className="text-lg font-bold text-text-primary">
          Movimientos
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="f-tipo" className="label-base">Tipo</label>
            <Select
              id="f-tipo"
              value={type}
              onChange={(e) => {
                setType(e.target.value as AccountMovementType | '');
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {(Object.keys(movementLabels) as AccountMovementType[]).map((t) => (
                <option key={t} value={t}>
                  {movementLabels[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="f-desde" className="label-base">Desde</label>
            <Input id="f-desde" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label htmlFor="f-hasta" className="label-base">Hasta</label>
            <Input id="f-hasta" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} error={invalidRange} />
          </div>
          <div className="flex items-end">
            <button
              className="btn-ghost w-full py-3"
              disabled={!hasFilters}
              onClick={() => {
                setType('');
                setFrom('');
                setTo('');
                setPage(1);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
        {invalidRange && (
          <p role="alert" className="mt-2 text-sm text-red-400">
            La fecha "desde" debe ser anterior a "hasta".
          </p>
        )}

        <div className="card-surface mt-4 px-4 sm:px-5" aria-live="polite">
          {loading ? (
            <ul className="divide-y divide-border-subtle">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between py-4">
                  <div className="space-y-2">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-52 rounded" />
                  </div>
                  <div className="skeleton h-4 w-20 rounded" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="py-4">
              <ErrorMessage message={error} onRetry={load} />
            </div>
          ) : data && data.items.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {data.items.map((m) => (
                <MovementRow key={m.id} m={m} />
              ))}
            </ul>
          ) : (
            <div className="py-6">
              <EmptyState
                title={hasFilters ? 'Sin movimientos con estos filtros' : 'Aún no tienes movimientos'}
                description={hasFilters ? 'Ajusta los filtros para ver más resultados.' : 'Recarga tu saldo para empezar a apostar.'}
                action={
                  !hasFilters ? (
                    <Link to="/billetera/recarga" className="btn-primary">
                      Recargar saldo
                    </Link>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>

        {data && !error && (
          <Pagination page={data.page} lastPage={data.lastPage} total={data.total} onChange={setPage} disabled={loading} />
        )}
      </section>
    </div>
  );
}
