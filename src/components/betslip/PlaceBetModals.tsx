import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/useToast';
import { betsService } from '@/services/betsService';
import { formatCurrency, formatOdd } from '@/utils/formatters';

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `bet-${Date.now()}-${Math.random()}`;
}

/** Confirmación, envío, éxito y error de la apuesta. Vive en el layout para sobrevivir a que el cupón se vacíe. */
export function PlaceBetModals() {
  const { selections, stake, mode, totalOdds, betCount, totalStake, potentialWin, flow, setFlow, clearSlip, closeSlip } =
    useBetSlip();
  const { balance, refresh } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const keyRef = useRef<string | null>(null);
  const asSingles = mode === 'single' && selections.length > 1;

  // La clave de idempotencia se mantiene mientras el usuario reintenta la misma apuesta.
  useEffect(() => {
    if (flow.step === 'confirm' && !keyRef.current) keyRef.current = newKey();
    if (flow.step === 'idle') keyRef.current = null;
  }, [flow.step]);

  async function submit() {
    setFlow({ step: 'submitting' });
    try {
      const bets = await betsService.placeBet({
        selections,
        stake,
        mode: asSingles ? 'single' : 'combo',
        idempotencyKey: keyRef.current ?? newKey(),
      });
      keyRef.current = null;
      clearSlip();
      closeSlip();
      setFlow({ step: 'success', bets });
      refresh();
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No fue posible registrar tu apuesta.';
      setFlow({ step: 'error', message });
      showToast(message, 'error');
    }
  }

  const close = () => setFlow({ step: 'idle' });
  const open = flow.step === 'confirm' || flow.step === 'submitting' || flow.step === 'error';

  return (
    <>
      <Modal isOpen={open} onClose={flow.step === 'submitting' ? () => undefined : close} title="Confirma tu apuesta">
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {selections.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-bg-secondary px-3 py-2">
              <span>
                <span className="block text-text-primary">{s.matchLabel}</span>
                <span className="text-xs text-text-secondary">{s.selectionLabel}</span>
              </span>
              <span className="font-bold text-gold">{formatOdd(s.odd)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4 text-sm">
          <Row label="Tipo" value={asSingles ? `${betCount} apuestas simples` : selections.length > 1 ? 'Combinada' : 'Simple'} />
          {!asSingles && <Row label="Cuota total" value={formatOdd(totalOdds)} />}
          <Row label="Total a apostar" value={formatCurrency(totalStake)} />
          <Row label="Pago potencial" value={formatCurrency(potentialWin)} strong />
          <Row label="Saldo después" value={formatCurrency(Math.max(0, balance - totalStake))} muted />
        </dl>
        {flow.step === 'error' && (
          <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {flow.message}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={close} disabled={flow.step === 'submitting'}>
            Volver
          </Button>
          <Button onClick={submit} loading={flow.step === 'submitting'}>
            {flow.step === 'error' ? 'Reintentar' : 'Confirmar'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={flow.step === 'success'} onClose={close} title="¡Apuesta realizada!">
        {flow.step === 'success' && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {flow.bets.length > 1 ? `Registramos ${flow.bets.length} apuestas.` : 'Tu apuesta quedó registrada.'}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {flow.bets.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2">
                  <span className="text-text-secondary">
                    #{b.code} · {formatCurrency(b.stake)}
                  </span>
                  <span className="font-semibold text-text-primary">{formatCurrency(b.potentialWin)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={close}>
                Seguir apostando
              </Button>
              <Button
                onClick={() => {
                  close();
                  navigate('/mis-apuestas');
                }}
              >
                Ver mis apuestas
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-text-secondary">
              ¿Poco saldo? <Link to="/billetera/recarga" onClick={close} className="text-gold underline">Recarga aquí</Link>
            </p>
          </>
        )}
      </Modal>
    </>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={strong ? 'text-lg font-bold text-gold' : muted ? 'text-text-secondary' : 'font-medium text-text-primary'}>
        {value}
      </dd>
    </div>
  );
}
