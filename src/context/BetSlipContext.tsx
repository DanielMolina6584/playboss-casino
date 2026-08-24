import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { BetSelection } from '@/types';
import { calculatePotentialWin, calculateTotalOdds } from '@/utils/formatters';

interface BetSlipContextValue {
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  isOpen: boolean;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (selectionId: string) => void;
  clearSlip: () => void;
  setStake: (value: number) => void;
  openSlip: () => void;
  closeSlip: () => void;
  toggleSlip: () => void;
}

export const BetSlipContext = createContext<BetSlipContextValue | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [stake, setStakeValue] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const addSelection = useCallback((selection: BetSelection) => {
    setSelections((prev) => {
      // Reemplaza la selección anterior del mismo partido (no se permiten
      // dos selecciones del mismo mercado en un mismo partido).
      const withoutSameMatch = prev.filter((s) => s.matchId !== selection.matchId);
      return [...withoutSameMatch, selection];
    });
    setIsOpen(true);
  }, []);

  const removeSelection = useCallback((selectionId: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== selectionId));
  }, []);

  const clearSlip = useCallback(() => {
    setSelections([]);
    setStakeValue(0);
  }, []);

  const setStake = useCallback((value: number) => {
    setStakeValue(Number.isFinite(value) && value >= 0 ? value : 0);
  }, []);

  const totalOdds = useMemo(() => calculateTotalOdds(selections.map((s) => s.odd)), [selections]);
  const potentialWin = useMemo(() => calculatePotentialWin(stake, totalOdds), [stake, totalOdds]);

  const openSlip = useCallback(() => setIsOpen(true), []);
  const closeSlip = useCallback(() => setIsOpen(false), []);
  const toggleSlip = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <BetSlipContext.Provider
      value={{
        selections,
        stake,
        totalOdds,
        potentialWin,
        isOpen,
        addSelection,
        removeSelection,
        clearSlip,
        setStake,
        openSlip,
        closeSlip,
        toggleSlip,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}
