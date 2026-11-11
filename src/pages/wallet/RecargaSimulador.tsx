import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { PaymentStatus, PaymentTransaction } from '@/types';
import { paymentsService } from '@/services/paymentsService';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/formatters';

const OUTCOMES: { value: PaymentStatus; label: string; cls: string }[] = [
  { value: 'approved', label: 'Aprobar pago', cls: 'btn-primary' },
  { value: 'declined', label: 'Rechazar pago', cls: 'btn-secondary' },
  { value: 'error', label: 'Simular error', cls: 'btn-secondary' },
  { value: 'pending', label: 'Dejar pendiente', cls: 'btn-ghost' },
];

/** Pasarela simulada (reemplaza a la pasarela de pagos cuando la API no está disponible). */
export function RecargaSimulador() {
  const [params] = useSearchParams();
  const reference = params.get('referencia') ?? '';
  const navigate = useNavigate();
  const [tx, setTx] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    paymentsService
      .getStatus(reference)
      .then(setTx)
      .catch((e) => setError((e as { message?: string }).message ?? 'No se encontró la transacción.'));
  }, [reference]);

  async function choose(outcome: PaymentStatus) {
    setBusy(outcome);
    await paymentsService.simulateOutcome(reference, outcome);
    navigate(`/billetera/recarga/resultado?referencia=${encodeURIComponent(reference)}`);
  }

  return (
    <div className="container-page flex min-h-[70vh] max-w-md items-center py-8">
      <div className="card-surface w-full p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Pasarela simulada · Sandbox</p>
        <h1 className="mt-2 text-xl font-bold text-text-primary">Simulador de pasarela</h1>
        <p className="mt-1 text-sm text-text-secondary">
          No se cobra dinero real. Elige el resultado que quieres probar.
        </p>
        {error ? (
          <div className="mt-5 space-y-4">
            <ErrorMessage message={error} />
            <Link to="/billetera/recarga" className="btn-secondary w-full">Volver a recargar</Link>
          </div>
        ) : !tx ? (
          <div className="flex justify-center py-10"><Loading /></div>
        ) : (
          <>
            <dl className="mt-5 space-y-2 rounded-lg bg-bg-secondary p-4 text-sm">
              <div className="flex justify-between"><dt className="text-text-secondary">Referencia</dt><dd className="font-mono text-xs text-text-primary">{tx.reference}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Monto</dt><dd className="font-bold text-text-primary">{formatCurrency(tx.amount)}</dd></div>
            </dl>
            <div className="mt-5 grid gap-2">
              {OUTCOMES.map((o) => (
                <button key={o.value} className={o.cls} disabled={busy !== null} onClick={() => choose(o.value)}>
                  {busy === o.value ? 'Procesando…' : o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
