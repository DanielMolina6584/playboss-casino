import type { BusinessLimits, LimitKey, LimitUsage, ResponsibleLimits, SelfExclusionDays } from '@/types';
import { httpClient, type ApiEnvelope } from '@/utils/httpClient';
import { currentMockUserId, isMockActive, withMock } from '@/services/dataSource';
import { DEFAULT_LIMITS, LIMITS } from '@/config/limits';
import { getMockLimits, LIMIT_KEYS, updateMockLimits, type LimitChanges } from '@/mocks/limits';

// Contratos: GET /configuracion/limites (público), GET/PUT /perfil/limites (docs/CONTRATOS-API.md)

type Money = string | number;
interface ApiConfigLimites {
  moneda?: string;
  apuestas?: {
    monto_minimo?: Money;
    monto_maximo?: Money;
    max_selecciones?: number;
    edad_minima?: number;
    limite_diario?: Money;
    max_apuestas_dia?: number;
  };
  recarga?: { monto_minimo?: Money; monto_maximo?: Money };
  retiro?: { monto_minimo?: Money; monto_maximo?: Money; max_pendientes?: number };
}
interface ApiLimitesJuego {
  limites: Record<string, Money | null>;
  consumo: Record<string, { limite: Money | null; usado: Money; disponible: Money | null }>;
  autoexclusion: { activa: boolean; hasta: string | null };
}

const num = (v: Money | undefined | null, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== null && v !== '' && Number.isFinite(n) ? n : fallback;
};

/** Claves del front (deposit_daily) <-> API (deposito_diario). */
const TYPE_API = { deposit: 'deposito', stake: 'apuesta' } as const;
const PERIOD_API = { daily: 'diario', weekly: 'semanal', monthly: 'mensual' } as const;
export function limitApiKey(key: LimitKey): string {
  const [t, p] = key.split('_') as [keyof typeof TYPE_API, keyof typeof PERIOD_API];
  return `${TYPE_API[t]}_${PERIOD_API[p]}`;
}

function mapConfig(c: ApiConfigLimites): BusinessLimits {
  const d = DEFAULT_LIMITS;
  return {
    currency: c.moneda || d.currency,
    minStake: num(c.apuestas?.monto_minimo, d.minStake),
    maxStake: num(c.apuestas?.monto_maximo, d.maxStake),
    maxSelections: num(c.apuestas?.max_selecciones, d.maxSelections),
    minAge: num(c.apuestas?.edad_minima, d.minAge),
    dailyStakeCap: num(c.apuestas?.limite_diario, d.dailyStakeCap),
    maxBetsPerDay: num(c.apuestas?.max_apuestas_dia, d.maxBetsPerDay),
    minDeposit: num(c.recarga?.monto_minimo, d.minDeposit),
    maxDeposit: num(c.recarga?.monto_maximo, d.maxDeposit),
    minWithdrawal: num(c.retiro?.monto_minimo, d.minWithdrawal),
    maxWithdrawal: num(c.retiro?.monto_maximo, d.maxWithdrawal),
    maxPendingWithdrawals: num(c.retiro?.max_pendientes, d.maxPendingWithdrawals),
  };
}

function mapGameLimits(a: ApiLimitesJuego): ResponsibleLimits {
  const limits = {} as Record<LimitKey, number | null>;
  const usage: Partial<Record<LimitKey, LimitUsage>> = {};
  LIMIT_KEYS.forEach((key) => {
    const api = limitApiKey(key);
    const v = a.limites?.[api];
    limits[key] = v === null || v === undefined ? null : Number(v);
    const c = a.consumo?.[api];
    if (c)
      usage[key] = {
        limit: c.limite === null ? null : Number(c.limite),
        used: Number(c.usado),
        available: c.disponible === null ? null : Number(c.disponible),
      };
  });
  return { limits, usage, selfExclusion: { active: !!a.autoexclusion?.activa, until: a.autoexclusion?.hasta ?? null } };
}

export type { LimitChanges };

export const limitsService = {
  /**
   * Carga GET /configuracion/limites y la vuelca en LIMITS. Nunca falla: ante cualquier
   * error (o en modo mock) se conservan los valores por defecto.
   */
  async loadBusinessLimits(): Promise<void> {
    if (isMockActive()) return;
    try {
      const res = await httpClient.get<ApiEnvelope<ApiConfigLimites>>('/configuracion/limites', { auth: false });
      Object.assign(LIMITS, mapConfig(res.data));
    } catch {
      /* respaldo: config/limits.ts */
    }
  },

  getGameLimits(): Promise<ResponsibleLimits> {
    return withMock(
      async () => mapGameLimits((await httpClient.get<ApiEnvelope<ApiLimitesJuego>>('/perfil/limites')).data),
      () => getMockLimits(currentMockUserId()),
      250,
    );
  },

  /** PUT parcial: solo se envían las claves cambiadas; `null` quita el límite. */
  updateGameLimits(changes: LimitChanges): Promise<ResponsibleLimits> {
    return withMock(
      async () => {
        const body: Record<string, string | number | null> = {};
        LIMIT_KEYS.forEach((k) => {
          if (k in changes) body[limitApiKey(k)] = changes[k] === null || changes[k] === undefined ? null : String(changes[k]);
        });
        if (changes.selfExclusionDays) body.autoexclusion_dias = changes.selfExclusionDays;
        const res = await httpClient.put<ApiEnvelope<ApiLimitesJuego>>('/perfil/limites', body);
        return mapGameLimits(res.data);
      },
      () => updateMockLimits(currentMockUserId(), changes),
      400,
    );
  },
};

export const SELF_EXCLUSION_OPTIONS: { days: SelfExclusionDays; label: string }[] = [
  { days: 1, label: '24 horas' },
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
  { days: 180, label: '180 días' },
  { days: 365, label: '1 año' },
];
