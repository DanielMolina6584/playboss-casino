import type { Account, AccountMovement, AccountMovementType, MovementFilters, Paginated, WithdrawalRequest } from '@/types';
import { httpClient, toQuery, type ApiEnvelope, type ApiPage } from '@/utils/httpClient';
import { currentMockUserId, mockError, withMock } from '@/services/dataSource';
import { getAccount, getDb, nextId, saveDb } from '@/mocks/store';
import { LIMITS } from '@/config/limits';

// Contrato: GET /cuenta, GET /cuenta/movimientos (docs/CONTRATOS-API.md)

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
};
const TIPO_TO_API = Object.fromEntries(Object.entries(TIPO_FROM_API).map(([k, v]) => [v, k])) as Record<
  AccountMovementType,
  string
>;

export const movementLabels: Record<AccountMovementType, string> = {
  deposit: 'Depósito',
  withdrawal: 'Retiro',
  bet_reserved: 'Apuesta realizada',
  bet_released: 'Apuesta anulada',
  bet_lost: 'Apuesta perdida',
  winnings: 'Premio',
};

function mapMovimiento(m: ApiMovimiento): AccountMovement {
  const type = TIPO_FROM_API[m.tipo] ?? 'deposit';
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

  /**
   * La API aún no tiene endpoint de retiros (solo transacciones tipo RETIRO en
   * el modelo). Se registra una solicitud SIMULADA en el navegador: no mueve
   * dinero ni llega a ningún backend. Ver docs/CONTRATOS-API.md (pendiente).
   */
  async requestWithdrawal(userId: string, amount: number, bankAccount: string): Promise<WithdrawalRequest> {
    await new Promise((r) => setTimeout(r, 600));
    const db = getDb();
    if (amount < LIMITS.minWithdrawal) throw mockError('El retiro mínimo es de $20.000.');
    const req: WithdrawalRequest = {
      id: `RET-${nextId(db)}`,
      amount,
      bankAccount,
      status: 'requested',
      createdAt: new Date().toISOString(),
      simulated: true,
    };
    (db.withdrawals[userId] ??= []).unshift(req);
    saveDb();
    return req;
  },
};
