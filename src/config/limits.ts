import type { BusinessLimits } from '@/types';

// Límites de negocio usados para validar en el cliente. La fuente de verdad es
// GET /configuracion/limites (services/limitsService.loadBusinessLimits lo aplica
// al arrancar); estos valores son el respaldo si la API no responde o en modo mock.
// La API valida de nuevo: aquí solo mejoran la UX.
export const DEFAULT_LIMITS: BusinessLimits = {
  currency: 'COP',
  minStake: 1_000,
  maxStake: 2_000_000,
  maxSelections: 10,
  minAge: 18,
  dailyStakeCap: 5_000_000,
  maxBetsPerDay: 100,
  minDeposit: 10_000,
  maxDeposit: 5_000_000,
  minWithdrawal: 20_000,
  maxWithdrawal: 5_000_000,
  maxPendingWithdrawals: 3,
};

/** Objeto mutable: se sobrescribe una vez al cargar la configuración (antes del primer render). */
export const LIMITS: BusinessLimits = { ...DEFAULT_LIMITS };

export const QUICK_STAKES = [5_000, 10_000, 20_000, 50_000, 100_000] as const;
export const QUICK_DEPOSITS = [20_000, 50_000, 100_000, 200_000, 500_000] as const;
