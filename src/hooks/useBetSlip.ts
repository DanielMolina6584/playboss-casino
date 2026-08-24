import { useContext } from 'react';
import { BetSlipContext } from '@/context/BetSlipContext';

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error('useBetSlip debe usarse dentro de <BetSlipProvider>');
  return ctx;
}
