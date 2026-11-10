import type { LimitKey, LimitPeriod, LimitType, LimitUsage, ResponsibleLimits, SelfExclusionDays } from '@/types';
import { mockError } from '@/services/dataSource';
import { getDb, saveDb, type MockLimitsRecord } from '@/mocks/store';
import { formatCurrency } from '@/utils/formatters';

// Réplica en el navegador de las reglas de LimiteJuegoService del API: periodos calendario,
// límites crecientes (diario <= semanal <= mensual) y autoexclusión que solo se puede ampliar.

export const LIMIT_TYPES: LimitType[] = ['deposit', 'stake'];
export const LIMIT_PERIODS: LimitPeriod[] = ['daily', 'weekly', 'monthly'];
export const LIMIT_KEYS: LimitKey[] = LIMIT_TYPES.flatMap((t) => LIMIT_PERIODS.map((p) => `${t}_${p}` as LimitKey));

export const PERIOD_LABEL: Record<LimitPeriod, string> = { daily: 'diario', weekly: 'semanal', monthly: 'mensual' };
export const TYPE_PLURAL: Record<LimitType, string> = { deposit: 'depósitos', stake: 'apuestas' };

export type LimitChanges = Partial<Record<LimitKey, number | null>> & { selfExclusionDays?: SelfExclusionDays };

function emptyRecord(): MockLimitsRecord {
  return {
    exclusionUntil: null,
    limits: Object.fromEntries(LIMIT_KEYS.map((k) => [k, null])) as Record<LimitKey, number | null>,
  };
}

function record(userId: string): MockLimitsRecord {
  const db = getDb();
  return (db.limits[userId] ??= emptyRecord());
}

function periodStart(period: LimitPeriod): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'weekly') d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lunes
  if (period === 'monthly') d.setDate(1);
  return d.getTime();
}

function used(userId: string, type: LimitType, period: LimitPeriod): number {
  const kind = type === 'stake' ? 'bet_reserved' : 'deposit';
  const from = periodStart(period);
  return (getDb().movements[userId] ?? [])
    .filter((m) => m.type === kind && new Date(m.createdAt).getTime() >= from)
    .reduce((a, m) => a + m.amount, 0);
}

function exclusionUntil(userId: string): string | null {
  const until = record(userId).exclusionUntil;
  return until && new Date(until).getTime() > Date.now() ? until : null;
}

export function getMockLimits(userId: string): ResponsibleLimits {
  const rec = record(userId);
  const usage: Partial<Record<LimitKey, LimitUsage>> = {};
  LIMIT_KEYS.forEach((key) => {
    const limit = rec.limits[key];
    if (limit === null) return;
    const [type, period] = key.split('_') as [LimitType, LimitPeriod];
    const u = used(userId, type, period);
    usage[key] = { limit, used: u, available: Math.max(0, limit - u) };
  });
  const until = exclusionUntil(userId);
  return { limits: { ...rec.limits }, usage, selfExclusion: { active: !!until, until } };
}

export function updateMockLimits(userId: string, changes: LimitChanges): ResponsibleLimits {
  const rec = record(userId);
  const next = { ...rec.limits };
  LIMIT_KEYS.forEach((k) => {
    if (k in changes) next[k] = changes[k] ?? null;
  });
  for (const type of LIMIT_TYPES) {
    for (let i = 1; i < LIMIT_PERIODS.length; i++) {
      const prev = next[`${type}_${LIMIT_PERIODS[i - 1]}` as LimitKey];
      const cur = next[`${type}_${LIMIT_PERIODS[i]}` as LimitKey];
      if (prev !== null && cur !== null && cur < prev)
        throw mockError(`El límite ${PERIOD_LABEL[LIMIT_PERIODS[i]]} no puede ser menor que el ${PERIOD_LABEL[LIMIT_PERIODS[i - 1]]}.`);
    }
  }
  if (changes.selfExclusionDays) {
    const until = new Date(Date.now() + changes.selfExclusionDays * 86_400_000);
    const current = exclusionUntil(userId);
    if (current && until.getTime() <= new Date(current).getTime())
      throw mockError(`Ya estás autoexcluido hasta ${current.slice(0, 10)}; no se puede acortar.`);
    rec.exclusionUntil = until.toISOString();
  }
  rec.limits = next;
  saveDb();
  return getMockLimits(userId);
}

/** Lanza el mismo 422 que el API si el usuario está autoexcluido o superaría un límite. */
export function assertWithinLimits(userId: string, type: LimitType, amount: number): void {
  const until = exclusionUntil(userId);
  if (until) throw mockError(`Estás autoexcluido hasta ${until.slice(0, 10)}; no puedes apostar ni depositar.`);
  const rec = record(userId);
  for (const period of LIMIT_PERIODS) {
    const limit = rec.limits[`${type}_${period}` as LimitKey];
    if (limit !== null && used(userId, type, period) + amount > limit)
      throw mockError(`Superas tu límite ${PERIOD_LABEL[period]} de ${TYPE_PLURAL[type]} (${formatCurrency(limit)}).`);
  }
}
