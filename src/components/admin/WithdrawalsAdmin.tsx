import { useCallback, useEffect, useState } from 'react';
import type { Paginated, WithdrawalRequest, WithdrawalStatus } from '@/types';
import { adminService } from '@/services/adminService';
import { accountTypeLabels, withdrawalStatusLabels } from '@/services/walletService';
import { AdminTable } from '@/components/admin/AdminTable';
import { WithdrawalStatusBadge } from '@/components/common/WithdrawalStatusBadge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { Loading } from '@/components/common/Loading';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

type Action = { kind: 'approve' | 'reject'; w: WithdrawalRequest };

export function WithdrawalsAdmin() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<WithdrawalStatus | ''>('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<WithdrawalRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminService.listWithdrawals(status, page));
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar los retiros.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  function open(kind: Action['kind'], w: WithdrawalRequest) {
    setAction({ kind, w });
    setReason('');
    setReasonError(null);
    setActionError(null);
  }

  async function confirm() {
    if (!action) return;
    if (action.kind === 'reject' && (reason.trim().length < 3 || reason.trim().length > 200)) {
      setReasonError('El motivo es obligatorio (3 a 200 caracteres).');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      if (action.kind === 'approve') await adminService.approveWithdrawal(action.w.id);
      else await adminService.rejectWithdrawal(action.w.id, reason.trim());
      showToast(action.kind === 'approve' ? `Retiro #${action.w.id} marcado como pagado.` : `Retiro #${action.w.id} rechazado.`, 'success');
      setAction(null);
      load();
    } catch (err) {
      setActionError((err as { message?: string })?.message ?? 'No fue posible completar la acción.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value as WithdrawalStatus | ''); setPage(1); }}>
          <option value="">Todos los estados</option>
          {(Object.keys(withdrawalStatusLabels) as WithdrawalStatus[]).map((s) => <option key={s} value={s}>{withdrawalStatusLabels[s]}</option>)}
        </Select>
      </div>
      <div aria-live="polite">
        {loading && !data && <div className="flex justify-center py-16"><Loading /></div>}
        {error && <ErrorMessage message={error} onRetry={load} />}
        {!error && data && (data.items.length ? (
          <AdminTable head={['#', 'Usuario', 'Monto', 'Destino', 'Estado', 'Solicitado', 'Acciones']}>
            {data.items.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-3 text-text-secondary">{w.id}</td>
                <td className="px-4 py-3 text-text-secondary">{w.userId ?? '—'}</td>
                <td className="px-4 py-3 font-semibold text-text-primary">{formatCurrency(w.amount)}</td>
                <td className="px-4 py-3 text-text-secondary">
                  <span className="block text-text-primary">{w.bank} · {accountTypeLabels[w.accountType]}</span>
                  <span className="block font-mono text-xs">{w.accountNumber}</span>
                  <span className="block text-xs">{w.holder}{w.holderDocument ? ` · ${w.holderDocument}` : ''}</span>
                </td>
                <td className="px-4 py-3">
                  <WithdrawalStatusBadge status={w.status} />
                  {w.rejectionReason && <span className="mt-1 block max-w-[14rem] text-xs text-text-secondary">{w.rejectionReason}</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(w.requestedAt)}</td>
                <td className="px-4 py-3">
                  {w.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => open('approve', w)}>Aprobar</button>
                      <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => open('reject', w)}>Rechazar</button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary">—</span>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <EmptyState title="No hay solicitudes de retiro" />
        ))}
        {data && <Pagination page={data.page} lastPage={data.lastPage} total={data.total} onChange={setPage} disabled={loading} />}
      </div>

      <Modal isOpen={!!action} onClose={busy ? () => undefined : () => setAction(null)} title={action?.kind === 'approve' ? 'Aprobar retiro' : 'Rechazar retiro'}>
        {action && (
          <>
            <p className="text-sm text-text-secondary">
              {action.kind === 'approve' ? (
                <>Marcarás como <strong className="text-text-primary">pagado</strong> el retiro #{action.w.id} por {formatCurrency(action.w.amount)}. El saldo retenido se consume; la transferencia real debe hacerse aparte.</>
              ) : (
                <>Rechazarás el retiro #{action.w.id} por {formatCurrency(action.w.amount)}. El monto vuelve al saldo disponible del usuario.</>
              )}
            </p>
            {action.kind === 'reject' && (
              <div className="mt-4">
                <label htmlFor="r-reason" className="label-base">Motivo del rechazo<span className="ml-0.5 text-gold">*</span></label>
                <Input id="r-reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} error={!!reasonError} />
                {reasonError && <p className="mt-1.5 text-sm text-red-400">{reasonError}</p>}
              </div>
            )}
            {actionError && <p role="alert" className="mt-3 text-sm text-red-400">{actionError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setAction(null)} disabled={busy}>Cancelar</Button>
              <Button onClick={confirm} loading={busy}>{action.kind === 'approve' ? 'Aprobar' : 'Rechazar'}</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
