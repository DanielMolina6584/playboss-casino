// Límites de negocio usados para validar en el cliente. La API valida de nuevo
// (reglas de apuesta en Mongo, tope diario, etc.); estos valores solo mejoran la UX.
export const LIMITS = {
  minStake: 1_000,
  maxStake: 2_000_000,
  maxSelections: 10,
  minDeposit: 10_000,
  maxDeposit: 5_000_000,
  minWithdrawal: 20_000,
  maxWithdrawal: 5_000_000,
  currency: 'COP',
} as const;

export const QUICK_STAKES = [5_000, 10_000, 20_000, 50_000, 100_000] as const;
export const QUICK_DEPOSITS = [20_000, 50_000, 100_000, 200_000, 500_000] as const;
