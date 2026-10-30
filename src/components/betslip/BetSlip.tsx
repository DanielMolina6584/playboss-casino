import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { BetSlipItem } from '@/components/betslip/BetSlipItem';
import { Button } from '@/components/common/Button';
import { formatAmountInput, formatCurrency, formatOdd, parseAmount } from '@/utils/formatters';
import { validateSlip } from '@/utils/betRules';
import { LIMITS, QUICK_STAKES } from '@/config/limits';

export function BetSlip({ onClose }: { onClose?: () => void }) {
  const {
    selections,
    stake,
    mode,
    totalOdds,
    betCount,
    totalStake,
    potentialWin,
    removeSelection,
    setStake,
    setMode,
    setFlow,
    clearSlip,
  } = useBetSlip();
  const { authenticated } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const hasSelections = selections.length > 0;
  const asSingles = mode === 'single' && selections.length > 1;
  const check = validateSlip({
    selections,
    stake,
    betCount,
    totalStake,
    balance: authenticated && !walletLoading ? balance : null,
  });
  const canSubmit = !check.error && !check.stakeError && stake >= LIMITS.minStake;
  const insufficient = !!check.stakeError && check.stakeError.startsWith('Saldo insuficiente');

  function handleSubmit() {
    if (!authenticated) {
      onClose?.();
      navigate('/login', { state: { from: location } });
      return;
    }
    if (canSubmit) setFlow({ step: 'confirm' });
  }

  if (!hasSelections) {
    return (
      <section aria-labelledby="empty-slip-title" className="rounded-xl border border-border-subtle bg-bg-secondary/40 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 id="empty-slip-title" className="text-sm font-semibold text-text-primary">Cupón de apuesta</h3>
          <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-text-secondary">0 selecciones</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-medium text-text-primary">Tu cupón está vacío</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">Elige una cuota para agregar una selección.</p>
          </div>
        </div>
      </section>
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

      {selections.length > 1 && (
        <div role="radiogroup" aria-label="Tipo de apuesta" className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-bg-secondary p-1 text-xs font-semibold">
          {([
            ['combo', 'Combinada'],
            ['single', 'Simples'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-md py-2 transition-colors ${
                mode === value ? 'bg-gold text-bg-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="my-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {selections.map((selection) => (
          <BetSlipItem key={selection.id} selection={selection} onRemove={() => removeSelection(selection.id)} />
        ))}
      </div>

      <div className="space-y-3 border-t border-border-subtle pt-3">
        {selections.length > 1 && (
          <p className="text-xs text-text-secondary">
            {asSingles
              ? `${selections.length} apuestas simples: el monto se aplica a cada una.`
              : 'Combinada: todas las selecciones deben acertar; las cuotas se multiplican.'}
          </p>
        )}

        {!asSingles && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Cuota total</span>
            <span className="font-bold text-gold">{formatOdd(totalOdds)}</span>
          </div>
        )}

        <div>
          <label htmlFor="stake" className="label-base">
            {asSingles ? 'Monto por apuesta' : 'Monto a apostar'}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">$</span>
            <input
              id="stake"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatAmountInput(stake)}
              onChange={(e) => setStake(parseAmount(e.target.value))}
              placeholder="0"
              aria-invalid={!!check.stakeError}
              aria-describedby="stake-hint"
              className={`input-base pl-8 ${check.stakeError ? 'input-error' : ''}`}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_STAKES.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setStake(amount)}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors hover:border-gold/50 hover:text-gold ${
                  stake === amount ? 'border-gold/60 text-gold' : 'border-border-subtle text-text-secondary'
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
          <p id="stake-hint" role={check.stakeError ? 'alert' : undefined} className={`mt-1.5 text-xs ${check.stakeError ? 'text-red-400' : 'text-text-secondary'}`}>
            {check.stakeError ?? `Mín. ${formatCurrency(LIMITS.minStake)} · Máx. ${formatCurrency(LIMITS.maxStake)}`}
            {insufficient && (
              <>
                {' '}
                <Link to="/billetera/recarga" onClick={onClose} className="font-semibold text-gold underline">
                  Recargar
                </Link>
              </>
            )}
          </p>
        </div>

        {check.error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {check.error}
          </p>
        )}

        <dl className="space-y-1.5 rounded-lg bg-bg-secondary px-3 py-2.5 text-sm">
          {betCount > 1 && (
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Total a apostar ({betCount})</dt>
              <dd className="font-medium text-text-primary">{formatCurrency(totalStake)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Pago potencial</dt>
            <dd className="font-bold text-text-primary" aria-live="polite">{formatCurrency(potentialWin)}</dd>
          </div>
          {authenticated && (
            <div className="flex items-center justify-between text-xs">
              <dt className="text-text-secondary">Tu saldo</dt>
              <dd className="text-text-secondary">{walletLoading ? '…' : formatCurrency(balance)}</dd>
            </div>
          )}
        </dl>

        <Button fullWidth onClick={handleSubmit} disabled={authenticated && !canSubmit}>
          {authenticated ? 'Apostar' : 'Inicia sesión para apostar'}
        </Button>
        {!authenticated && <p className="text-center text-xs text-text-secondary">Tu cupón se conserva al iniciar sesión.</p>}
      </div>
    </div>
  );
}
