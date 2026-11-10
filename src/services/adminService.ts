import type { AdminUser, Paginated, UserStatus, WithdrawalRequest, WithdrawalStatus } from '@/types';
import { httpClient, toQuery, type ApiEnvelope, type ApiPage } from '@/utils/httpClient';
import { currentMockUserId, mockError, withMock } from '@/services/dataSource';
import { getDb, postMovement, saveDb } from '@/mocks/store';
import { mapRetiro, type ApiRetiro } from '@/services/walletService';
import { mockRequireAdminMfa } from '@/mocks/mfa';

// Contratos: GET /admin/usuarios, PUT /admin/usuarios/{id}/estado, GET /admin/retiros,
// POST /admin/retiros/{id}/aprobar|rechazar (docs/CONTRATOS-API.md)

interface ApiAdminUsuario {
  id_usuario: number;
  rol_codigo: string;
  estado_codigo: string;
  fecha_registro?: string;
  correo?: string | null;
  nombre?: string | null;
  tipo_documento_codigo?: string | null;
  numero_documento?: string | null;
}

export interface AdminUserFilters {
  q?: string;
  status?: UserStatus | '';
  role?: 'CLIENTE' | 'ADMIN' | '';
  page?: number;
}

const STATUS_API: Record<WithdrawalStatus, string> = { pending: 'PENDIENTE', paid: 'PAGADO', rejected: 'RECHAZADO' };
const PER_PAGE = 10;

function mapUser(u: ApiAdminUsuario): AdminUser {
  return {
    id: String(u.id_usuario),
    name: u.nombre ?? '',
    email: u.correo ?? '',
    role: u.rol_codigo,
    status: (['ACT', 'BLQ', 'SUS'].includes(u.estado_codigo) ? u.estado_codigo : 'ACT') as UserStatus,
    documentType: u.tipo_documento_codigo ?? '',
    documentNumber: u.numero_documento ?? '',
    registeredAt: u.fecha_registro ?? '',
  };
}

function paginate<T>(all: T[], page: number): Paginated<T> {
  return {
    items: all.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    page,
    perPage: PER_PAGE,
    total: all.length,
    lastPage: Math.max(1, Math.ceil(all.length / PER_PAGE)),
  };
}

function mockWithdrawal(id: string) {
  const w = getDb().withdrawals.find((x) => x.id === id);
  if (!w) throw mockError('Retiro no encontrado.', 404);
  return w;
}

export const adminService = {
  listUsers(f: AdminUserFilters = {}): Promise<Paginated<AdminUser>> {
    const page = f.page ?? 1;
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiAdminUsuario>>>(
          `/admin/usuarios${toQuery({ page, per_page: PER_PAGE, q: f.q?.trim(), estado: f.status, rol: f.role })}`,
        );
        const { items, meta } = res.data;
        return { items: items.map(mapUser), page: meta.page, perPage: meta.per_page, total: meta.total, lastPage: meta.last_page };
      },
      () => {
        mockRequireAdminMfa(currentMockUserId());
        const q = f.q?.trim().toLowerCase();
        const all = getDb()
          .users.filter((r) => !f.status || r.status === f.status)
          .filter((r) => !f.role || (f.role === 'ADMIN') === (r.user.role === 'admin'))
          .filter((r) => !q || `${r.user.fullName} ${r.user.email}`.toLowerCase().includes(q))
          .map<AdminUser>((r) => ({
            id: r.user.id,
            name: r.user.fullName,
            email: r.user.email,
            role: r.user.role === 'admin' ? 'ADMIN' : 'CLIENTE',
            status: r.status,
            documentType: r.user.documentType ?? 'CC',
            documentNumber: r.user.documentId ? `****${r.user.documentId.slice(-4)}` : '',
            registeredAt: r.user.createdAt,
          }));
        return paginate(all, page);
      },
      300,
    );
  },

  setUserStatus(id: string, status: UserStatus, reason?: string): Promise<AdminUser> {
    return withMock(
      async () => {
        const res = await httpClient.put<ApiEnvelope<ApiAdminUsuario>>(`/admin/usuarios/${encodeURIComponent(id)}/estado`, {
          estado: status,
          ...(reason ? { motivo: reason } : {}),
        });
        return mapUser(res.data);
      },
      () => {
        mockRequireAdminMfa(currentMockUserId());
        const rec = getDb().users.find((r) => r.user.id === id);
        if (!rec) throw mockError('Usuario no encontrado.', 404);
        rec.status = status;
        saveDb();
        return {
          id,
          name: rec.user.fullName,
          email: rec.user.email,
          role: rec.user.role === 'admin' ? 'ADMIN' : 'CLIENTE',
          status,
          documentType: rec.user.documentType ?? 'CC',
          documentNumber: rec.user.documentId ? `****${rec.user.documentId.slice(-4)}` : '',
          registeredAt: rec.user.createdAt,
        };
      },
      300,
    );
  },

  listWithdrawals(status?: WithdrawalStatus | '', page = 1): Promise<Paginated<WithdrawalRequest>> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiRetiro>>>(
          `/admin/retiros${toQuery({ page, per_page: PER_PAGE, estado: status ? STATUS_API[status] : undefined })}`,
        );
        const { items, meta } = res.data;
        return { items: items.map(mapRetiro), page: meta.page, perPage: meta.per_page, total: meta.total, lastPage: meta.last_page };
      },
      () => {
        mockRequireAdminMfa(currentMockUserId());
        const all = getDb()
          .withdrawals.filter((w) => !status || w.status === status)
          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
          .map((w) => ({ ...w }));
        return paginate(all, page);
      },
      300,
    );
  },

  approveWithdrawal(id: string): Promise<WithdrawalRequest> {
    return withMock(
      async () => mapRetiro((await httpClient.post<ApiEnvelope<ApiRetiro>>(`/admin/retiros/${encodeURIComponent(id)}/aprobar`)).data),
      () => {
        mockRequireAdminMfa(currentMockUserId());
        const w = mockWithdrawal(id);
        if (w.status === 'rejected') throw mockError('Ya fue rechazado.', 409);
        if (w.status === 'pending') {
          w.status = 'paid';
          w.resolvedAt = new Date().toISOString();
          postMovement(w.userId, 'withdrawal_paid', w.amount, { held: -w.amount }, `Retiro #${w.id} pagado`);
          saveDb();
        }
        return { ...w };
      },
      400,
    );
  },

  rejectWithdrawal(id: string, reason: string): Promise<WithdrawalRequest> {
    return withMock(
      async () =>
        mapRetiro((await httpClient.post<ApiEnvelope<ApiRetiro>>(`/admin/retiros/${encodeURIComponent(id)}/rechazar`, { motivo: reason })).data),
      () => {
        mockRequireAdminMfa(currentMockUserId());
        if (reason.trim().length < 3) throw mockError('El motivo es obligatorio (mínimo 3 caracteres).');
        const w = mockWithdrawal(id);
        if (w.status === 'paid') throw mockError('Ya fue pagado.', 409);
        if (w.status === 'pending') {
          w.status = 'rejected';
          w.rejectionReason = reason.trim();
          w.resolvedAt = new Date().toISOString();
          postMovement(w.userId, 'withdrawal_released', w.amount, { available: w.amount, held: -w.amount }, `Retiro #${w.id} rechazado`);
          saveDb();
        }
        return { ...w };
      },
      400,
    );
  },
};
