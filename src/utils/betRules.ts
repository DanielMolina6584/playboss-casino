import type { BetSelection } from '@/types';
import { LIMITS } from '@/config/limits';
import { formatCurrency } from '@/utils/formatters';

export interface SlipCheck {
  /** Error que impide apostar. */
  error: string | null;
  /** Error concreto del campo monto (para mostrarlo bajo el input). */
  stakeError: string | null;
}

/** Valida el cupón antes de confirmar. `balance` null = sin sesión / aún no cargado. */
export function validateSlip(params: {
  selections: BetSelection[];
  stake: number;
  betCount: number;
  totalStake: number;
  balance: number | null;
}): SlipCheck {
  const { selections, stake, betCount, totalStake, balance } = params;
  if (selections.length === 0) return { error: 'Agrega al menos una selección.', stakeError: null };
  if (selections.length > LIMITS.maxSelections)
    return { error: `Máximo ${LIMITS.maxSelections} selecciones por cupón.`, stakeError: null };
  const ids = new Set<string>();
  const matches = new Set<string>();
  for (const s of selections) {
    if (ids.has(s.id)) return { error: 'Hay selecciones duplicadas en el cupón.', stakeError: null };
    if (matches.has(s.matchId)) return { error: 'No puedes combinar dos resultados del mismo partido.', stakeError: null };
    ids.add(s.id);
    matches.add(s.matchId);
  }
  if (!stake) return { error: null, stakeError: null }; // aún sin monto: no se muestra error, solo se bloquea
  if (stake < LIMITS.minStake)
    return { error: null, stakeError: `El monto mínimo es ${formatCurrency(LIMITS.minStake)}.` };
  if (stake > LIMITS.maxStake)
    return { error: null, stakeError: `El monto máximo es ${formatCurrency(LIMITS.maxStake)}.` };
  if (balance !== null && totalStake > balance)
    return {
      error: null,
      stakeError: `Saldo insuficiente${betCount > 1 ? ` para ${betCount} apuestas` : ''}. Tu saldo es ${formatCurrency(balance)}.`,
    };
  return { error: null, stakeError: null };
}
