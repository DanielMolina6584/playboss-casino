import { useContext } from 'react';
import { WalletContext } from '@/context/WalletContext';

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet debe usarse dentro de <WalletProvider>');
  return ctx;
}
