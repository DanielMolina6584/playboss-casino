import { useState } from 'react';
import type { Bet, BetStatus, SelectionResult } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { betsService } from '@/services/betsService';
import { useToast } from '@/hooks/useToast';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/utils/formatters';

export const betStatusConfig: Record<BetStatus, { label: string; className: string }> = {
  pending: { label: 'Activa', className: 'bg-gold/15 text-gold' },
  won: { label: 'Ganada', className: 'bg-emerald-500/15 text-emerald-400' },
  lost: { label: 'Perdida', className: 'bg-red-500/15 text-red-400' },
  void: { label: 'Anulada', className: 'bg-white/10 text-text-secondary' },
};

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const c = betStatusConfig[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.className}`}>{c.label}</span>;
}

const resultCfg: Record<SelectionResult, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'text-text-secondary' },
  won: { label: 'Acertó', cls: 'text-emerald-400' },
  lost: { label: 'Falló', cls: 'text-red-400' },
  void: { label: 'Anulada', cls: 'text-text-secondary' },
};

export function ResultLabel({ result }: { result: SelectionResult }) {
  const c = resultCfg[result];
  return <span className={`text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

export function CancelBetModal({
  bet,
  onClose,
  onCancelled,
}: {
  bet: Bet | null;
  onClose: () => void;
  onCancelled: (bet: Bet) => void;
}) {
  const { showToast } = useToast();
  const { refresh } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!bet) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await betsService.cancelBet(bet.id);
      showToast(`Apuesta ${bet.code} cancelada. Te devolvimos ${formatCurrency(bet.stake)}.`, 'success');
      refresh();
      onCancelled(updated);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cancelar la apuesta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={!!bet} onClose={busy ? () => undefined : onClose} title="Cancelar apuesta">
      {bet && (
        <>
          <p className="text-sm text-text-secondary">
            Vas a cancelar la apuesta <strong className="text-text-primary">{bet.code}</strong>. Se devolverán{' '}
            <strong className="text-text-primary">{formatCurrency(bet.stake)}</strong> a tu saldo disponible.
          </p>
          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Mantener
            </Button>
            <Button onClick={confirm} loading={busy}>
              Sí, cancelar
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
