import type { Bet, BetLeg, BetStatus, Paginated, PlaceBetParams, SelectionResult } from '@/types';
import { httpClient, toQuery, type ApiEnvelope, type ApiPage } from '@/utils/httpClient';
import { currentMockUserId, mockError, withMock } from '@/services/dataSource';
import { betCode, getAccount, getDb, nextId, postMovement, saveDb } from '@/mocks/store';
import { matches as mockMatches } from '@/mocks/data';
import { assertWithinLimits } from '@/mocks/limits';

// Contrato: POST /apuestas, GET /apuestas, GET /apuestas/{id}, POST /apuestas/{id}/cancelar

interface ApiDetalle {
  partido_id: number;
  partido?: string | null;
  local?: string | null;
  visitante?: string | null;
  local_escudo_url?: string | null;
  visitante_escudo_url?: string | null;
  liga?: string | null;
  fecha_partido?: string | null;
  estado_partido?: string | null;
  opcion?: string | null;
  mercado?: string | null;
  market_id: string;
  selection_code: string;
  etiqueta: string | null;
  cuota: string | number;
  resultado: string | null;
}
interface ApiApuesta {
  id: number;
  tipo: 'SIMPLE' | 'COMBINADA';
  estado: string;
  monto: string | number;
  cuota_total: string | number;
  pago_potencial: string | number;
  creada_en: string;
  liquidada_en: string | null;
  selecciones: ApiDetalle[];
}

const STATUS_FROM_API: Record<string, BetStatus> = {
  PEND: 'pending',
  GAN: 'won',
  PER: 'lost',
  ANU: 'void',
  CASH: 'void', // cierre anticipado: sin pantalla propia aún (ver docs/CONTRATOS-API.md)
};
export const STATUS_TO_API: Record<BetStatus, string> = { pending: 'PEND', won: 'GAN', lost: 'PER', void: 'ANU' };

function mapResult(r: string | null): SelectionResult {
  const v = (r ?? '').toUpperCase();
  if (v.startsWith('GAN') || v === 'WON') return 'won';
  if (v.startsWith('PER') || v === 'LOST') return 'lost';
  if (v.startsWith('ANU') || v === 'VOID') return 'void';
  return 'pending';
}

function mapApuesta(a: ApiApuesta, userId = ''): Bet {
  const status = STATUS_FROM_API[a.estado] ?? 'pending';
  return {
    id: String(a.id),
    code: betCode(a.id),
    userId,
    type: a.tipo === 'SIMPLE' ? 'single' : 'combo',
    stake: Number(a.monto),
    totalOdds: Number(a.cuota_total),
    potentialWin: Number(a.pago_potencial),
    status,
    createdAt: a.creada_en,
    settledAt: a.liquidada_en,
    cancellable: status === 'pending',
    selections: a.selecciones.map<BetLeg>((d) => ({
      id: `${d.partido_id}:${d.market_id}:${d.selection_code}`,
      matchId: String(d.partido_id),
      marketId: d.market_id,
      selectionCode: d.selection_code,
      matchLabel: d.partido || (d.local && d.visitante ? `${d.local} vs ${d.visitante}` : `Partido #${d.partido_id}`),
      marketName: d.mercado || 'Mercado',
      selectionLabel: d.opcion || d.etiqueta || d.selection_code,
      odd: Number(d.cuota),
      matchDate: d.fecha_partido ?? undefined,
      homeName: d.local ?? undefined,
      awayName: d.visitante ?? undefined,
      homeLogo: d.local_escudo_url || undefined,
      awayLogo: d.visitante_escudo_url || undefined,
      leagueName: d.liga ?? undefined,
      matchStatus: d.estado_partido ?? undefined,
      result: mapResult(d.resultado),
    })),
  };
}

export interface BetListFilters {
  status?: BetStatus | 'all';
  page?: number;
  perPage?: number;
}

function mockPlace(params: PlaceBetParams): Bet[] {
  const userId = currentMockUserId();
  const db = getDb();
  const groups = params.mode === 'single' ? params.selections.map((s) => [s]) : [params.selections];
  const totalStake = params.stake * groups.length;
  const acc = getAccount(userId);

  params.selections.forEach((s) => {
    const m = mockMatches.find((x) => x.id === s.matchId);
    if (!m || m.status !== 'scheduled' || new Date(m.date).getTime() <= Date.now())
      throw mockError(`El partido ${s.matchLabel} ya no admite apuestas.`);
  });
  assertWithinLimits(userId, 'stake', totalStake);
  if (totalStake > acc.availableBalance) throw mockError('Saldo insuficiente para esta apuesta.');

  return groups.map((legs) => {
    const id = String(nextId(db));
    const totalOdds = Number(legs.reduce((a, l) => a * l.odd, 1).toFixed(2));
    const bet: Bet = {
      id,
      code: betCode(id),
      userId,
      type: legs.length === 1 ? 'single' : 'combo',
      selections: legs.map((l) => ({ ...l, result: 'pending' as const })),
      stake: params.stake,
      totalOdds,
      potentialWin: Math.round(params.stake * totalOdds),
      status: 'pending',
      createdAt: new Date().toISOString(),
      settledAt: null,
      cancellable: true,
    };
    (db.bets[userId] ??= []).unshift(bet);
    postMovement(userId, 'bet_reserved', params.stake, { available: -params.stake, held: params.stake }, `Apuesta ${bet.code}`, {
      betId: id,
    });
    return bet;
  });
}

export const betsService = {
  /** Registra la apuesta. En modo "single" con N selecciones crea N apuestas simples. */
  async placeBet(params: PlaceBetParams): Promise<Bet[]> {
    return withMock(
      async () => {
        const groups = params.mode === 'single' ? params.selections.map((s) => [s]) : [params.selections];
        const bets: Bet[] = [];
        for (let i = 0; i < groups.length; i++) {
          const legs = groups[i];
          const res = await httpClient.post<ApiEnvelope<ApiApuesta>>('/apuestas', {
            monto: String(params.stake),
            tipo: legs.length === 1 ? 'SIMPLE' : 'COMBINADA',
            idempotency_key: `${params.idempotencyKey}-${i}`,
            selecciones: legs.map((s) => ({
              match_id: Number(s.matchId),
              market_id: s.marketId,
              selection_code: s.selectionCode,
              odd: s.odd,
            })),
          });
          bets.push(mapApuesta(res.data));
        }
        return bets;
      },
      () => mockPlace(params),
      900,
    );
  },

  getMyBets(filters: BetListFilters = {}): Promise<Paginated<Bet>> {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 10;
    const status = filters.status && filters.status !== 'all' ? filters.status : undefined;
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiApuesta>>>(
          `/apuestas${toQuery({ page, per_page: perPage, estado: status ? STATUS_TO_API[status] : undefined })}`,
        );
        const { items, meta } = res.data;
        return {
          items: items.map((a) => mapApuesta(a)),
          page: meta.page,
          perPage: meta.per_page,
          total: meta.total,
          lastPage: meta.last_page,
        };
      },
      () => {
        const all = (getDb().bets[currentMockUserId()] ?? [])
          .filter((b) => !status || b.status === status)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return {
          items: all.slice((page - 1) * perPage, page * perPage),
          page,
          perPage,
          total: all.length,
          lastPage: Math.max(1, Math.ceil(all.length / perPage)),
        };
      },
    );
  },

  getBet(id: string): Promise<Bet> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiApuesta>>(`/apuestas/${encodeURIComponent(id)}`);
        return mapApuesta(res.data);
      },
      () => {
        const bet = (getDb().bets[currentMockUserId()] ?? []).find((b) => b.id === id);
        if (!bet) throw mockError('Apuesta no encontrada.', 404);
        return bet;
      },
      250,
    );
  },

  cancelBet(id: string): Promise<Bet> {
    return withMock(
      async () => {
        const res = await httpClient.post<ApiEnvelope<ApiApuesta>>(`/apuestas/${encodeURIComponent(id)}/cancelar`);
        return mapApuesta(res.data);
      },
      () => {
        const userId = currentMockUserId();
        const bet = (getDb().bets[userId] ?? []).find((b) => b.id === id);
        if (!bet) throw mockError('Apuesta no encontrada.', 404);
        if (bet.status !== 'pending') throw mockError('Solo se pueden cancelar apuestas pendientes.', 409);
        if (bet.selections.some((s) => s.matchDate && new Date(s.matchDate).getTime() <= Date.now()))
          throw mockError('Un partido de la apuesta ya comenzó; no se puede cancelar.', 409);
        bet.status = 'void';
        bet.cancellable = false;
        bet.settledAt = new Date().toISOString();
        bet.selections.forEach((s) => (s.result = 'void'));
        postMovement(userId, 'bet_released', bet.stake, { available: bet.stake, held: -bet.stake }, `Cancelación ${bet.code}`, {
          betId: bet.id,
        });
        saveDb();
        return bet;
      },
      600,
    );
  },
};
