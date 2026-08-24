import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { BetSlipItem } from '@/components/betslip/BetSlipItem';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { formatCurrency, formatOdd } from '@/utils/formatters';
import { betsService } from '@/services/betsService';

const QUICK_STAKES = [10000, 20000, 50000, 100000];

export function BetSlip({ onClose }: { onClose?: () => void }) {
  const { selections, stake, totalOdds, potentialWin, removeSelection, setStake, clearSlip } = useBetSlip();
  const { authenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const hasSelections = selections.length > 0;

  async function handlePlaceBet() {
    if (!authenticated || !user) {
      navigate('/login');
      return;
    }
    if (!stake || stake <= 0) {
      showToast('Ingresa un monto válido para apostar.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await betsService.placeBet({ userId: user.id, selections, stake, totalOdds, potentialWin });
      showToast('¡Apuesta realizada con éxito!', 'success');
      clearSlip();
      onClose?.();
      navigate('/mis-apuestas');
    } catch {
      showToast('No fue posible registrar tu apuesta. Intenta nuevamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasSelections) {
    return (
      <EmptyState
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        }
        title="Tu cupón está vacío"
        description="Haz clic en una cuota para agregar tu primera selección."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h3 className="text-base font-semibold text-text-primary">
          Cupón de apuesta <span className="text-text-secondary">({selections.length})</span>
        </h3>
        <button onClick={clearSlip} className="text-xs font-medium text-text-secondary hover:text-red-400">
          Vaciar
        </button>
      </div>

      <div className="my-3 flex-1 space-y-2 overflow-y-auto">
        {selections.map((selection) => (
          <BetSlipItem key={selection.id} selection={selection} onRemove={() => removeSelection(selection.id)} />
        ))}
      </div>

      <div className="space-y-3 border-t border-border-subtle pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Cuota total</span>
          <span className="font-bold text-gold">{formatOdd(totalOdds)}</span>
        </div>

        <div>
          <label htmlFor="stake" className="label-base">
            Monto a apostar
          </label>
          <input
            id="stake"
            type="number"
            min={0}
            inputMode="numeric"
            value={stake || ''}
            onChange={(e) => setStake(Number(e.target.value))}
            placeholder="0"
            className="input-base"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_STAKES.map((amount) => (
              <button
                key={amount}
                onClick={() => setStake(amount)}
                className="rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-gold/50 hover:text-gold"
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2.5 text-sm">
          <span className="text-text-secondary">Ganancia potencial</span>
          <span className="font-bold text-text-primary">{formatCurrency(potentialWin)}</span>
        </div>

        {!authenticated && (
          <p className="text-center text-xs text-text-secondary">Debes iniciar sesión para apostar.</p>
        )}

        <Button fullWidth loading={submitting} onClick={handlePlaceBet}>
          {authenticated ? 'Realizar apuesta' : 'Iniciar sesión para apostar'}
        </Button>
      </div>
    </div>
  );
}
