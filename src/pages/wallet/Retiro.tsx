import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { WithdrawalRequest } from '@/types';
import { walletService } from '@/services/walletService';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { formatAmountInput, formatCurrency, parseAmount } from '@/utils/formatters';
import { LIMITS } from '@/config/limits';

export function Retiro() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [amount, setAmount] = useState(0);
  const [account, setAccount] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; account?: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<WithdrawalRequest | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (amount < LIMITS.minWithdrawal) next.amount = `El retiro mínimo es ${formatCurrency(LIMITS.minWithdrawal)}.`;
    else if (amount > LIMITS.maxWithdrawal) next.amount = `El retiro máximo es ${formatCurrency(LIMITS.maxWithdrawal)}.`;
    else if (amount > balance) next.amount = `Saldo insuficiente. Disponible: ${formatCurrency(balance)}.`;
    if (!/^\d{7,20}$/.test(account.replace(/\s|-/g, ''))) next.account = 'Ingresa un número de cuenta o celular Nequi válido (solo dígitos).';
    setErrors(next);
    if (Object.keys(next).length || !user) return;

    setLoading(true);
    setSubmitError(null);
    try {
      setDone(await walletService.requestWithdrawal(user.id, amount, account.replace(/\s|-/g, '')));
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? 'No fue posible registrar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title="Solicitar retiro" description="Retira tus ganancias a tu cuenta bancaria o Nequi." backTo={{ to: '/billetera', label: 'Mi billetera' }} />

      <div role="note" className="mb-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
        <strong>Función en preparación:</strong> los retiros todavía no están conectados al backend. Esta pantalla registra una
        solicitud simulada y no mueve dinero.
      </div>

      <div className="card-surface p-5 sm:p-7">
        {done ? (
          <div className="text-center" role="status">
            <h2 className="text-xl font-bold text-text-primary">Solicitud registrada (simulada)</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {formatCurrency(done.amount)} · cuenta ••••{done.bankAccount.slice(-4)} · ref. {done.id}
            </p>
            <Link to="/billetera" className="btn-primary mt-6">Volver a mi billetera</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <p className="text-sm text-text-secondary">
              Saldo disponible: <span className="font-bold text-text-primary">{formatCurrency(balance)}</span>
            </p>
            <FormField label="Monto a retirar (COP)" htmlFor="w-amount" error={errors.amount} hint={`Mínimo ${formatCurrency(LIMITS.minWithdrawal)}`} required>
              <Input
                id="w-amount"
                inputMode="numeric"
                placeholder="0"
                value={formatAmountInput(amount)}
                onChange={(e) => setAmount(parseAmount(e.target.value))}
                error={!!errors.amount}
              />
            </FormField>
            <FormField label="Cuenta bancaria o celular Nequi" htmlFor="w-account" error={errors.account} required>
              <Input id="w-account" inputMode="numeric" placeholder="3001234567" value={account} onChange={(e) => setAccount(e.target.value)} error={!!errors.account} />
            </FormField>
            {submitError && <p role="alert" className="text-sm text-red-400">{submitError}</p>}
            <Button type="submit" fullWidth loading={loading}>Solicitar retiro</Button>
          </form>
        )}
      </div>
    </div>
  );
}
