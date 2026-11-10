import { useCallback, useEffect, useState } from 'react';
import type { AdminUser, Paginated, UserStatus } from '@/types';
import { adminService } from '@/services/adminService';
import { mfaService } from '@/services/mfaService';
import { AdminTable } from '@/components/admin/AdminTable';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { Loading } from '@/components/common/Loading';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

const STATUS_LABEL: Record<UserStatus, string> = { ACT: 'Activo', BLQ: 'Bloqueado', SUS: 'Suspendido' };
const STATUS_CLS: Record<UserStatus, string> = {
  ACT: 'bg-emerald-500/15 text-emerald-400',
  BLQ: 'bg-red-500/15 text-red-400',
  SUS: 'bg-gold/15 text-gold',
};

export function UsersAdmin() {
  const { showToast } = useToast();
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [role, setRole] = useState<'CLIENTE' | 'ADMIN' | ''>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<{ user: AdminUser; status: UserStatus } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mfaTarget, setMfaTarget] = useState<AdminUser | null>(null);
  const [mfaReason, setMfaReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminService.listUsers({ q, status, role, page }));
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [q, status, role, page]);

  // El texto de búsqueda se espera 300 ms para no consultar en cada tecla.
  useEffect(() => {
    const id = window.setTimeout(load, 300);
    return () => window.clearTimeout(id);
  }, [load]);

  async function confirm() {
    if (!target) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminService.setUserStatus(target.user.id, target.status, reason.trim() || undefined);
      showToast(`${target.user.name || target.user.email}: ${STATUS_LABEL[target.status].toLowerCase()}.`, 'success');
      setTarget(null);
      setReason('');
      load();
    } catch (err) {
      setActionError((err as { message?: string })?.message ?? 'No fue posible cambiar el estado.');
    } finally {
      setBusy(false);
    }
  }

  async function resetMfa() {
    if (!mfaTarget) return;
    setBusy(true);
    setActionError(null);
    try {
      const r = await mfaService.adminReset(mfaTarget.id, mfaReason.trim());
      showToast(r.hadMfa ? `2FA de ${mfaTarget.name || mfaTarget.email} restablecido; sus sesiones se cerraron.` : 'Ese usuario no tenía 2FA; se cerraron sus sesiones.', 'success');
      setMfaTarget(null);
      setMfaReason('');
    } catch (err) {
      setActionError((err as { message?: string })?.message ?? 'No fue posible restablecer el 2FA.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_10rem_10rem]">
        <Input
          type="search"
          aria-label="Buscar usuario"
          placeholder="Buscar por nombre o correo"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <Select aria-label="Filtrar por estado" value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }}>
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </Select>
        <Select aria-label="Filtrar por rol" value={role} onChange={(e) => { setRole(e.target.value as 'CLIENTE' | 'ADMIN' | ''); setPage(1); }}>
          <option value="">Todos los roles</option>
          <option value="CLIENTE">Cliente</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      <div aria-live="polite">
        {loading && !data && <div className="flex justify-center py-16"><Loading /></div>}
        {error && <ErrorMessage message={error} onRetry={load} />}
        {!error && data && (data.items.length ? (
          <AdminTable head={['Nombre', 'Correo', 'Documento', 'Rol', 'Estado', 'Registro', 'Acción']}>
            {data.items.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-text-primary">{u.name || '—'}</td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3 text-text-secondary">{u.documentType} {u.documentNumber}</td>
                <td className="px-4 py-3 text-text-secondary">{u.role}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[u.status]}`}>{STATUS_LABEL[u.status]}</span></td>
                <td className="px-4 py-3 text-text-secondary">{u.registeredAt ? formatDate(u.registeredAt) : '—'}</td>
                <td className="px-4 py-3">
                  {u.id === me?.id ? (
                    <span className="text-xs text-text-secondary">Tu cuenta</span>
                  ) : (
                    <div className="flex items-center gap-2">
                    <Select
                      aria-label={`Cambiar estado de ${u.name || u.email}`}
                      value=""
                      onChange={(e) => { setTarget({ user: u, status: e.target.value as UserStatus }); setReason(''); setActionError(null); }}
                      className="py-1.5 text-xs"
                    >
                      <option value="" disabled>Cambiar a…</option>
                      {(Object.keys(STATUS_LABEL) as UserStatus[]).filter((s) => s !== u.status).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      className="whitespace-nowrap text-xs font-medium text-gold hover:text-gold-secondary"
                      onClick={() => { setMfaTarget(u); setMfaReason(''); setActionError(null); }}
                    >
                      Restablecer 2FA
                    </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <EmptyState title="No hay usuarios con esos filtros" />
        ))}
        {data && <Pagination page={data.page} lastPage={data.lastPage} total={data.total} onChange={setPage} disabled={loading} />}
      </div>

      <Modal isOpen={!!target} onClose={busy ? () => undefined : () => setTarget(null)} title="Cambiar estado de usuario">
        {target && (
          <>
            <p className="text-sm text-text-secondary">
              ¿Pasar a <strong className="text-text-primary">{target.user.name || target.user.email}</strong> de {STATUS_LABEL[target.user.status].toLowerCase()} a{' '}
              <strong className="text-text-primary">{STATUS_LABEL[target.status].toLowerCase()}</strong>? Un usuario no activo no puede iniciar sesión ni operar.
            </p>
            <label htmlFor="u-reason" className="label-base mt-4">Motivo (opcional)</label>
            <Input id="u-reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
            {actionError && <p role="alert" className="mt-3 text-sm text-red-400">{actionError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>Cancelar</Button>
              <Button onClick={confirm} loading={busy}>Confirmar</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={!!mfaTarget} onClose={busy ? () => undefined : () => setMfaTarget(null)} title="Restablecer 2FA">
        {mfaTarget && (
          <>
            <p className="text-sm text-text-secondary">
              Se quitará la verificación en dos pasos de <strong className="text-text-primary">{mfaTarget.name || mfaTarget.email}</strong> y se cerrarán sus sesiones. Deberá configurarla de nuevo. Queda registrado en la auditoría.
            </p>
            <label htmlFor="u-mfa-reason" className="label-base mt-4">Motivo (obligatorio)</label>
            <Input id="u-mfa-reason" maxLength={300} placeholder="Perdió el teléfono; identidad validada" value={mfaReason} onChange={(e) => setMfaReason(e.target.value)} />
            {actionError && <p role="alert" className="mt-3 text-sm text-red-400">{actionError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setMfaTarget(null)} disabled={busy}>Cancelar</Button>
              <Button onClick={resetMfa} loading={busy} disabled={mfaReason.trim().length < 5}>Restablecer</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
