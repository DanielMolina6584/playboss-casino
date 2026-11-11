import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PaymentStatus, PaymentTransaction } from '@/types';
import { paymentsService, recallReference } from '@/services/paymentsService';
import { useWallet } from '@/hooks/useWallet';
import { Loading } from '@/components/common/Loading';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

const POLL_MS = 3000;
const MAX_POLLS = 10; // ~30 s antes de dejar la transacción como "en revisión"

const VIEW: Record<PaymentStatus, { title: string; text: string; tone: string; icon: string }> = {
  approved: {
    title: '¡Recarga aprobada!',
    text: 'Tu saldo ya está disponible para apostar.',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    icon: 'M5 13l4 4L19 7',
  },
  declined: {
    title: 'Pago rechazado',
    text: 'La pasarela no aprobó el pago. No se te cobró nada; puedes intentarlo con otro método.',
    tone: 'border-red-500/30 bg-red-500/10 text-red-300',
    icon: 'M6 6l12 12M18 6L6 18',
  },
  error: {
    title: 'No pudimos procesar el pago',
    text: 'Ocurrió un error con la pasarela o el pago fue cancelado. Si te descontaron dinero, se reversará automáticamente.',
    tone: 'border-red-500/30 bg-red-500/10 text-red-300',
    icon: 'M12 8v5M12 17h.01',
  },
  pending: {
    title: 'Pago en proceso',
    text: 'Estamos esperando la confirmación de la pasarela. Puede tardar unos minutos; te acreditaremos el saldo apenas se apruebe.',
    tone: 'border-gold/30 bg-gold/10 text-gold',
    icon: 'M12 7v5l3 2',
  },
};

export function RecargaResultado() {
  const [params] = useSearchParams();
  const reference = params.get('referencia') ?? params.get('reference') ?? params.get('ref') ?? params.get('external_reference') ?? recallReference();
  const { refresh } = useWallet();
  const [tx, setTx] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [round, setRound] = useState(0);
  const refreshed = useRef(false);

  const check = useCallback(async () => {
    if (!reference) return null;
    try {
      const t = await paymentsService.getStatus(reference);
      setTx(t);
      setError(null);
      return t;
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible consultar el estado del pago.');
      return null;
    }
  }, [reference]);

  useEffect(() => {
    if (!reference) {
      setPolling(false);
      return;
    }
    let cancelled = false;
    let polls = 0;
    setPolling(true);
    const tick = async () => {
      const t = await check();
      polls++;
      if (cancelled) return;
      const final = t && t.status !== 'pending';
      if (final || polls >= MAX_POLLS) {
        setPolling(false);
        return;
      }
      timer = window.setTimeout(tick, POLL_MS);
    };
    let timer = window.setTimeout(tick, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reference, check, round]);

  useEffect(() => {
    if (tx?.status === 'approved' && !refreshed.current) {
      refreshed.current = true;
      refresh();
    }
  }, [tx?.status, refresh]);

  if (!reference) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-text-primary">No encontramos tu pago</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Falta la referencia de la transacción. Revisa tus movimientos o inicia una nueva recarga.
        </p>
        <Actions primary={{ to: '/billetera', label: 'Ir a mi billetera' }} secondary={{ to: '/billetera/recarga', label: 'Nueva recarga' }} />
      </Shell>
    );
  }

  if (!tx) {
    return (
      <Shell>
        {error && !polling ? (
          <>
            <h1 className="text-xl font-bold text-text-primary">No pudimos consultar el pago</h1>
            <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>
            <div className="mt-6 grid gap-3">
              <button className="btn-primary" onClick={() => setRound((r) => r + 1)}>Reintentar</button>
              <Link to="/billetera" className="btn-secondary">Ir a mi billetera</Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6">
            <Loading label="Confirmando tu pago…" />
          </div>
        )}
      </Shell>
    );
  }

  const view = VIEW[tx.status];
  return (
    <Shell>
      <div role="status" aria-live="polite" className="flex flex-col items-center text-center">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full border ${view.tone}`}>
          {tx.status === 'pending' && polling ? (
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d={view.icon} />
              {tx.status === 'pending' && <circle cx="12" cy="12" r="9" />}
              {tx.status === 'error' && <circle cx="12" cy="12" r="9" />}
            </svg>
          )}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">{view.title}</h1>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{view.text}</p>
      </div>

      <dl className="mt-6 space-y-2 rounded-xl border border-border-subtle p-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-text-secondary">Monto</dt><dd className="font-bold text-text-primary">{formatCurrency(tx.amount)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-text-secondary">Referencia</dt><dd className="break-all text-right font-mono text-xs text-text-primary">{tx.reference}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-text-secondary">Fecha</dt><dd className="text-text-primary">{formatDateTime(tx.confirmedAt ?? tx.createdAt)}</dd></div>
        {tx.simulated && <p className="pt-1 text-xs text-gold">Transacción simulada (modo demostración).</p>}
      </dl>

      {tx.status === 'approved' && (
        <Actions primary={{ to: '/apuestas', label: 'Ir a apostar' }} secondary={{ to: '/billetera', label: 'Ver mi billetera' }} />
      )}
      {(tx.status === 'declined' || tx.status === 'error') && (
        <Actions primary={{ to: '/billetera/recarga', label: 'Intentar de nuevo' }} secondary={{ to: '/billetera', label: 'Ir a mi billetera' }} />
      )}
      {tx.status === 'pending' && (
        <div className="mt-6 grid gap-3">
          <button className="btn-primary" disabled={polling} onClick={() => setRound((r) => r + 1)}>
            {polling ? 'Consultando…' : 'Consultar de nuevo'}
          </button>
          <Link to="/billetera" className="btn-secondary">Ir a mi billetera</Link>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page max-w-lg py-10">
      <div className="card-surface animate-fade-in p-6 sm:p-8">{children}</div>
    </div>
  );
}

function Actions({ primary, secondary }: { primary: { to: string; label: string }; secondary: { to: string; label: string } }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <Link to={secondary.to} className="btn-secondary">{secondary.label}</Link>
      <Link to={primary.to} className="btn-primary">{primary.label}</Link>
    </div>
  );
}
