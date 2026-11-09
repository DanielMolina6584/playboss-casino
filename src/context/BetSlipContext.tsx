import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bet, BetMode, BetSelection } from '@/types';
import { calculateTotalOdds } from '@/utils/formatters';
import { LIMITS } from '@/config/limits';

export type AddResult = 'added' | 'replaced' | 'removed' | 'max';

export type BetFlow =
  | { step: 'idle' }
  | { step: 'confirm' }
  | { step: 'submitting' }
  | { step: 'success'; bets: Bet[] }
  | { step: 'error'; message: string };

interface BetSlipContextValue {
  selections: BetSelection[];
  stake: number;
  mode: BetMode;
  /** Cuota total de la combinada (producto). En modo "single" es solo informativa. */
  totalOdds: number;
  /** Número de apuestas que se crearán (1 combinada o N simples). */
  betCount: number;
  /** Monto total que se descontará del saldo. */
  totalStake: number;
  potentialWin: number;
  isOpen: boolean;
  flow: BetFlow;
  /** Agrega (o reemplaza la del mismo partido). Si la cuota ya estaba elegida, la quita. */
  toggleSelection: (selection: BetSelection) => AddResult;
  hasSelection: (oddId: string) => boolean;
  removeSelection: (selectionId: string) => void;
  clearSlip: () => void;
  setStake: (value: number) => void;
  setMode: (mode: BetMode) => void;
  setFlow: (flow: BetFlow) => void;
  openSlip: () => void;
  closeSlip: () => void;
  toggleSlip: () => void;
}

export const BetSlipContext = createContext<BetSlipContextValue | undefined>(undefined);

const STORAGE_KEY = 'playboss_betslip';

function readStored(): { selections: BetSelection[]; stake: number; mode: BetMode } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      return {
        selections: Array.isArray(v.selections) ? v.selections : [],
        stake: Number(v.stake) || 0,
        mode: v.mode === 'single' ? 'single' : 'combo',
      };
    }
  } catch {
    /* noop */
  }
  return { selections: [], stake: 0, mode: 'combo' };
}

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readStored, []);
  const [selections, setSelections] = useState<BetSelection[]>(initial.selections);
  const [stake, setStakeValue] = useState(initial.stake);
  const [mode, setMode] = useState<BetMode>(initial.mode);
  const [isOpen, setIsOpen] = useState(false);
  const [flow, setFlow] = useState<BetFlow>({ step: 'idle' });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ selections, stake, mode }));
    } catch {
      /* noop */
    }
  }, [selections, stake, mode]);

  const toggleSelection = useCallback(
    (selection: BetSelection): AddResult => {
      if (selections.some((s) => s.id === selection.id)) {
        setSelections((prev) => prev.filter((s) => s.id !== selection.id));
        return 'removed';
      }
      const sameMatch = selections.some((s) => s.matchId === selection.matchId);
      if (!sameMatch && selections.length >= LIMITS.maxSelections) return 'max';
      // Selecciones excluyentes: un partido solo admite una cuota en el cupón.
      setSelections((prev) => [...prev.filter((s) => s.matchId !== selection.matchId), selection]);
      setIsOpen(true);
      return sameMatch ? 'replaced' : 'added';
    },
    [selections],
  );

  const hasSelection = useCallback((oddId: string) => selections.some((s) => s.id === oddId), [selections]);

  const removeSelection = useCallback((selectionId: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== selectionId));
  }, []);

  const clearSlip = useCallback(() => {
    setSelections([]);
    setStakeValue(0);
  }, []);

  const setStake = useCallback((value: number) => {
    setStakeValue(Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0);
  }, []);

  const totalOdds = useMemo(() => Number(calculateTotalOdds(selections.map((s) => s.odd)).toFixed(2)), [selections]);
  const asSingles = mode === 'single' && selections.length > 1;
  const betCount = selections.length === 0 ? 0 : asSingles ? selections.length : 1;
  const totalStake = stake * betCount;
  const potentialWin = useMemo(
    () =>
      asSingles
        ? Math.round(selections.reduce((acc, s) => acc + stake * s.odd, 0))
        : Math.round(stake * totalOdds),
    [asSingles, selections, stake, totalOdds],
  );

  const openSlip = useCallback(() => setIsOpen(true), []);
  const closeSlip = useCallback(() => setIsOpen(false), []);
  const toggleSlip = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <BetSlipContext.Provider
      value={{
        selections,
        stake,
        mode,
        totalOdds,
        betCount,
        totalStake,
        potentialWin,
        isOpen,
        flow,
        toggleSelection,
        hasSelection,
        removeSelection,
        clearSlip,
        setStake,
        setMode,
        setFlow,
        openSlip,
        closeSlip,
        toggleSlip,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}
