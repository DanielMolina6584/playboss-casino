import type {
  Account,
  AccountMovement,
  AccountMovementType,
  BankAccountType,
  MovementFilters,
  Paginated,
  WithdrawalPayload,
  WithdrawalRequest,
  WithdrawalStatus,
} from '@/types';
import { httpClient, toQuery, type ApiEnvelope, type ApiPage } from '@/utils/httpClient';
import { currentMockUserId, mockError, withMock } from '@/services/dataSource';
import { getAccount, getDb, nextId, postMovement, saveDb, type MockWithdrawal } from '@/mocks/store';
import { LIMITS } from '@/config/limits';
import { formatCurrency } from '@/utils/formatters';

// Contrato: GET /cuenta, GET /cuenta/movimientos, POST/GET /pagos/retiros (docs/CONTRATOS-API.md)

interface ApiCuenta {
  saldo_disponible: string | number;
  saldo_retenido: string | number;
  moneda: string;
}
interface ApiMovimiento {
  id: number;
  tipo: string;
  monto: string | number;
  saldo_disponible: string | number;
  saldo_retenido: string | number;
  apuesta_id: number | null;
  descripcion: string | null;
  fecha: string;
}

const TIPO_FROM_API: Record<string, AccountMovementType> = {
  DEPOSITO: 'deposit',
  RETIRO: 'withdrawal',
  APUESTA_RESERVADA: 'bet_reserved',
  APUESTA_ANULADA: 'bet_released',
  APUESTA_PERDIDA: 'bet_lost',
  APUESTA_GANADA: 'winnings',
  RETIRO_RESERVADO: 'withdrawal_reserved',
  RETIRO_PAGADO: 'withdrawal_paid',
  RETIRO_LIBERADO: 'withdrawal_released',
};
const TIPO_TO_API = Object.fromEntries(Object.entries(TIPO_FROM_API).map(([k, v]) => [v, k])) as Record<
  AccountMovementType,
  string
>;

export const movementLabels: Record<AccountMovementType, string> = {
  deposit: 'Depósito',
  withdrawal: 'Retiro',
  withdrawal_reserved: 'Retiro solicitado',
  withdrawal_paid: 'Retiro pagado',
  withdrawal_released: 'Retiro rechazado (devuelto)',
  bet_reserved: 'Apuesta realizada',
  bet_released: 'Apuesta anulada',
  bet_lost: 'Apuesta perdida',
  winnings: 'Premio',
};

function mapMovimiento(m: ApiMovimiento): AccountMovement {
  const type = TIPO_FROM_API[m.tipo?.toUpperCase()] ?? 'deposit';
  return {
    id: String(m.id),
    type,
    amount: Number(m.monto),
    availableBalanceAfter: Number(m.saldo_disponible),
    heldBalanceAfter: Number(m.saldo_retenido),
    betId: m.apuesta_id ? String(m.apuesta_id) : null,
    description: m.descripcion ?? movementLabels[type],
    createdAt: m.fecha,
  };
}

export interface ApiRetiro {
  id: number;
  estado: string;
  monto: string | number;
  moneda?: string;
  destino: {
    banco: string;
    tipo_cuenta: BankAccountType;
    numero_cuenta: string;
    titular: string;
    documento_titular?: string;
  };
  motivo_rechazo?: string | null;
  solicitado_en?: string;
  resuelto_en?: string | null;
  usuario_id?: number;
}

const RETIRO_ESTADO: Record<string, WithdrawalStatus> = { PENDIENTE: 'pending', PAGADO: 'paid', RECHAZADO: 'rejected' };

export const withdrawalStatusLabels: Record<WithdrawalStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  rejected: 'Rechazado',
};

export const accountTypeLabels: Record<BankAccountType, string> = {
  AHORROS: 'Cuenta de ahorros',
  CORRIENTE: 'Cuenta corriente',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
};

export function mapRetiro(r: ApiRetiro): WithdrawalRequest {
  return {
    id: String(r.id),
    amount: Number(r.monto),
    currency: r.moneda || 'COP',
    status: RETIRO_ESTADO[r.estado?.toUpperCase()] ?? 'pending',
    bank: r.destino?.banco ?? '',
    accountType: r.destino?.tipo_cuenta ?? 'AHORROS',
    accountNumber: r.destino?.numero_cuenta ?? '',
    holder: r.destino?.titular ?? '',
    holderDocument: r.destino?.documento_titular,
    rejectionReason: r.motivo_rechazo ?? null,
    requestedAt: r.solicitado_en ?? '',
    resolvedAt: r.resuelto_en ?? null,
    userId: r.usuario_id !== undefined ? String(r.usuario_id) : undefined,
  };
}

/** Vista de cliente: número enmascarado y sin documento (igual que el API). */
function toClientView(w: MockWithdrawal): WithdrawalRequest {
  const { userId: _u, key: _k, holderDocument: _d, ...rest } = w;
  void _u; void _k; void _d;
  return { ...rest, accountNumber: `****${w.accountNumber.slice(-4)}` };
}

function mockRequestWithdrawal(p: WithdrawalPayload): WithdrawalRequest {
  const db = getDb();
  const userId = currentMockUserId();
  const existing = db.withdrawals.find((w) => w.userId === userId && w.key === p.idempotencyKey);
  if (existing) return toClientView(existing);

  const rec = db.users.find((u) => u.user.id === userId);
  if (p.amount < LIMITS.minWithdrawal) throw mockError(`El retiro mínimo es ${formatCurrency(LIMITS.minWithdrawal)}.`);
  if (p.amount > LIMITS.maxWithdrawal) throw mockError(`El retiro máximo es ${formatCurrency(LIMITS.maxWithdrawal)}.`);
  if (rec && rec.user.documentId && rec.user.documentId !== p.holderDocument)
    throw mockError('El documento del titular debe coincidir con el de tu cuenta.');
  if (p.amount > getAccount(userId).availableBalance) throw mockError('Saldo insuficiente para este retiro.');
  const pending = db.withdrawals.filter((w) => w.userId === userId && w.status === 'pending').length;
  if (pending >= LIMITS.maxPendingWithdrawals)
    throw mockError(`Ya tienes ${pending} solicitudes de retiro pendientes. Espera a que se resuelvan.`);

  const w: MockWithdrawal = {
    id: String(nextId(db)),
    userId,
    key: p.idempotencyKey,
    amount: p.amount,
    currency: 'COP',
    status: 'pending',
    bank: p.bank,
    accountType: p.accountType,
    accountNumber: p.accountNumber,
    holder: p.holder,
    holderDocument: p.holderDocument,
    rejectionReason: null,
    requestedAt: new Date().toISOString(),
    resolvedAt: null,
  };
  db.withdrawals.unshift(w);
  postMovement(userId, 'withdrawal_reserved', p.amount, { available: -p.amount, held: p.amount }, `Retiro #${w.id} solicitado`);
  saveDb();
  return toClientView(w);
}

export const walletService = {
  getAccount(): Promise<Account> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiCuenta>>('/cuenta');
        return {
          availableBalance: Number(res.data.saldo_disponible),
          heldBalance: Number(res.data.saldo_retenido),
          currency: res.data.moneda || 'COP',
        };
      },
      () => ({ ...getAccount(currentMockUserId()) }),
      200,
    );
  },

  getMovements(filters: MovementFilters = {}): Promise<Paginated<AccountMovement>> {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 10;
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiMovimiento>>>(
          `/cuenta/movimientos${toQuery({
            page,
            per_page: perPage,
            tipo: filters.type ? TIPO_TO_API[filters.type] : undefined,
            desde: filters.from,
            hasta: filters.to,
          })}`,
        );
        const { items, meta } = res.data;
        return {
          items: items.map(mapMovimiento),
          page: meta.page,
          perPage: meta.per_page,
          total: meta.total,
          lastPage: meta.last_page,
        };
      },
      () => {
        const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
        const to = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null;
        const all = (getDb().movements[currentMockUserId()] ?? [])
          .filter((m) => !filters.type || m.type === filters.type)
          .filter((m) => from === null || new Date(m.createdAt).getTime() >= from)
          .filter((m) => to === null || new Date(m.createdAt).getTime() <= to);
        const lastPage = Math.max(1, Math.ceil(all.length / perPage));
        return {
          items: all.slice((page - 1) * perPage, page * perPage),
          page,
          perPage,
          total: all.length,
          lastPage,
        };
      },
    );
  },

  /** POST /pagos/retiros: crea una solicitud PENDIENTE y reserva el saldo (movimiento RETIRO_RESERVADO). */
  requestWithdrawal(payload: WithdrawalPayload): Promise<WithdrawalRequest> {
    return withMock(
      async () => {
        const res = await httpClient.post<ApiEnvelope<ApiRetiro>>('/pagos/retiros', {
          monto: String(payload.amount),
          banco: payload.bank,
          tipo_cuenta: payload.accountType,
          numero_cuenta: payload.accountNumber,
          titular: payload.holder,
          documento_titular: payload.holderDocument,
          idempotency_key: payload.idempotencyKey,
        });
        return mapRetiro(res.data);
      },
      () => mockRequestWithdrawal(payload),
      600,
    );
  },

  /** GET /pagos/retiros: mis solicitudes (más recientes primero). */
  getWithdrawals(page = 1, perPage = 10): Promise<Paginated<WithdrawalRequest>> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiRetiro>>>(`/pagos/retiros${toQuery({ page, per_page: perPage })}`);
        const { items, meta } = res.data;
        return { items: items.map(mapRetiro), page: meta.page, perPage: meta.per_page, total: meta.total, lastPage: meta.last_page };
      },
      () => {
        const all = getDb()
          .withdrawals.filter((w) => w.userId === currentMockUserId())
          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
          .map(toClientView);
        return {
          items: all.slice((page - 1) * perPage, page * perPage),
          page,
          perPage,
          total: all.length,
          lastPage: Math.max(1, Math.ceil(all.length / perPage)),
        };
      },
      300,
    );
  },
};
