import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Account } from '@/types';
import { walletService } from '@/services/walletService';
import { useAuth } from '@/hooks/useAuth';

interface WalletContextValue {
  account: Account | null;
  balance: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setAccount(await walletService.getAccount());
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible consultar tu saldo.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setAccount(null);
      setError(null);
      return;
    }
    refresh();
  }, [userId, refresh]);

  return (
    <WalletContext.Provider value={{ account, balance: account?.availableBalance ?? 0, loading, error, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}
