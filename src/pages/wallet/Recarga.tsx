import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethodCode } from '@/types';
import { paymentMethods, paymentsService } from '@/services/paymentsService';
import { useWallet } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { LimitLink } from '@/components/common/LimitLink';
import { Button } from '@/components/common/Button';
import { formatAmountInput, formatCurrency, parseAmount } from '@/utils/formatters';
import { LIMITS, QUICK_DEPOSITS } from '@/config/limits';

type Step = 1 | 2 | 3;

const STEPS = ['Monto', 'Método', 'Confirmar'];

export function Recarga() {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [step, setStep] = useState<Step>(1);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethodCode>('WOMPI_CARD');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);

  const amountError =
    amount < LIMITS.minDeposit
      ? `El monto mínimo de recarga es ${formatCurrency(LIMITS.minDeposit)}.`
      : amount > LIMITS.maxDeposit
        ? `El monto máximo por recarga es ${formatCurrency(LIMITS.maxDeposit)}.`
        : null;
  const methodLabel = paymentMethods.find((m) => m.code === method)?.label ?? '';

  function nextFromAmount() {
    setTouched(true);
    if (!amountError) setStep(2);
  }

  async function pay() {
    setSubmitting(true);
    setError(null);
    // La misma clave mientras se reintenta evita depósitos duplicados.
    keyRef.current ??= `dep-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const tx = await paymentsService.createDeposit(amount, method, keyRef.current);
      const url = tx.checkout?.checkoutUrl;
      if (!url) throw { message: 'La pasarela no devolvió datos de pago. Intenta de nuevo.' };
      setRedirecting(true);
      if (/^https?:\/\//.test(url)) window.location.assign(url);
      else navigate(url);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible iniciar el pago.');
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title="Recargar saldo" description="Deposita de forma segura con nuestra pasarela de pagos." backTo={{ to: '/billetera', label: 'Mi billetera' }} />

      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Pasos de la recarga">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label} aria-current={current ? 'step' : undefined} className="flex flex-col gap-2">
              <span className={`h-1 rounded-full ${done || current ? 'bg-gold' : 'bg-white/10'}`} />
              <span className={`text-xs font-semibold ${current ? 'text-gold' : done ? 'text-text-primary' : 'text-text-secondary'}`}>
                {n}. {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="card-surface p-5 sm:p-7">
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-text-primary">¿Cuánto quieres recargar?</h2>
            <label htmlFor="amount" className="label-base mt-4">Monto en pesos (COP)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={formatAmountInput(amount)}
                onChange={(e) => setAmount(parseAmount(e.target.value))}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !!amountError}
                aria-describedby="amount-hint"
                className={`input-base pl-8 text-lg font-semibold ${touched && amountError ? 'input-error' : ''}`}
              />
            </div>
            <p id="amount-hint" role={touched && amountError ? 'alert' : undefined} className={`mt-2 text-sm ${touched && amountError ? 'text-red-400' : 'text-text-secondary'}`}>
              {touched && amountError ? amountError : `Mínimo ${formatCurrency(LIMITS.minDeposit)} · Máximo ${formatCurrency(LIMITS.maxDeposit)}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_DEPOSITS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:border-gold/60 hover:text-gold ${
                    amount === q ? 'border-gold/60 text-gold' : 'border-border-subtle text-text-secondary'
                  }`}
                >
                  {formatCurrency(q)}
                </button>
              ))}
            </div>
            <Button fullWidth className="mt-6" onClick={nextFromAmount}>
              Continuar
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-text-primary">Elige cómo pagar</h2>
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">Método de pago</legend>
              {paymentMethods.map((m) => (
                <label
                  key={m.code}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                    method === m.code ? 'border-gold bg-gold/10' : 'border-border-subtle hover:border-gold/40'
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-text-primary">{m.label}</span>
                    <span className="text-sm text-text-secondary">{m.hint}</span>
                  </span>
                  <input
                    type="radio"
                    name="method"
                    value={m.code}
                    checked={method === m.code}
                    onChange={() => setMethod(m.code)}
                    className="h-4 w-4 accent-gold"
                  />
                </label>
              ))}
            </fieldset>
            <p className="mt-3 text-xs text-text-secondary">
              La pasarela te mostrará los medios disponibles al pagar; puedes cambiar de método allí si lo necesitas.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button onClick={() => setStep(3)}>Continuar</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-text-primary">Revisa tu recarga</h2>
            <dl className="mt-4 divide-y divide-border-subtle rounded-xl border border-border-subtle text-sm">
              <div className="flex justify-between p-4">
                <dt className="text-text-secondary">Monto a recargar</dt>
                <dd className="font-bold text-text-primary">{formatCurrency(amount)}</dd>
              </div>
              <div className="flex justify-between p-4">
                <dt className="text-text-secondary">Método</dt>
                <dd className="text-text-primary">{methodLabel}</dd>
              </div>
              <div className="flex justify-between p-4">
                <dt className="text-text-secondary">Comisión</dt>
                <dd className="text-text-primary">Sin costo</dd>
              </div>
              <div className="flex justify-between p-4">
                <dt className="text-text-secondary">Saldo después de aprobar</dt>
                <dd className="font-bold text-gold">{formatCurrency(balance + amount)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-text-secondary">
              Al continuar te llevaremos a la pasarela de pagos segura. Tu saldo se acredita cuando el pago sea aprobado.
            </p>
            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
                <LimitLink message={error} />
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} disabled={submitting}>
                Atrás
              </Button>
              <Button onClick={pay} loading={submitting}>
                {redirecting ? 'Redirigiendo…' : `Pagar ${formatCurrency(amount)}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
