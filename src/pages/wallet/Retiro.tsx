import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { BankAccountType, Paginated, WithdrawalRequest } from '@/types';
import { accountTypeLabels, walletService } from '@/services/walletService';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { WithdrawalStatusBadge } from '@/components/common/WithdrawalStatusBadge';
import { formatAmountInput, formatCurrency, formatDateTime, parseAmount } from '@/utils/formatters';
import { LIMITS } from '@/config/limits';

const ACCOUNT_TYPES = Object.keys(accountTypeLabels) as BankAccountType[];
type Errors = Partial<Record<'amount' | 'bank' | 'accountNumber' | 'holder' | 'holderDocument' | 'mfaCode', string>>;

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `ret-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function Retiro() {
  const { user } = useAuth();
  const { balance, refresh } = useWallet();
  const { showToast } = useToast();
  const [amount, setAmount] = useState(0);
  const [bank, setBank] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('AHORROS');
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState(user?.fullName ?? '');
  const [holderDocument, setHolderDocument] = useState((user?.documentId ?? '').replace(/\D/g, ''));
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Con 2FA activo cada retiro exige un código vigente (de la app o de recuperación).
  const [mfaCode, setMfaCode] = useState('');
  const [mfaForced, setMfaForced] = useState(false);
  const needMfa = !!user?.mfaActive || mfaForced;
  // Misma clave mientras se reintenta: el API devuelve la solicitud ya creada en vez de duplicarla.
  const keyRef = useRef<string | null>(null);

  const [page, setPage] = useState(1);
  const [list, setList] = useState<Paginated<WithdrawalRequest> | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      setList(await walletService.getWithdrawals(page, 5));
    } catch (err) {
      setListError((err as { message?: string })?.message ?? 'No fue posible cargar tus solicitudes.');
    } finally {
      setListLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  function validate(): Errors {
    const next: Errors = {};
    if (amount < LIMITS.minWithdrawal) next.amount = `El retiro mínimo es ${formatCurrency(LIMITS.minWithdrawal)}.`;
    else if (amount > LIMITS.maxWithdrawal) next.amount = `El retiro máximo es ${formatCurrency(LIMITS.maxWithdrawal)}.`;
    else if (amount > balance) next.amount = `Saldo insuficiente. Disponible: ${formatCurrency(balance)}.`;
    if (!bank.trim()) next.bank = 'Indica el banco o la billetera.';
    else if (bank.trim().length > 60) next.bank = 'Máximo 60 caracteres.';
    if (!/^\d{6,20}$/.test(accountNumber.replace(/[\s-]/g, ''))) next.accountNumber = 'Entre 6 y 20 dígitos, sin letras.';
    if (holder.trim().length < 3 || holder.trim().length > 120) next.holder = 'Ingresa el nombre del titular (3 a 120 caracteres).';
    if (!/^\d{5,15}$/.test(holderDocument)) next.holderDocument = 'Entre 5 y 15 dígitos, sin puntos ni letras.';
    if (needMfa && !mfaCode.trim()) next.mfaCode = 'Ingresa el código de tu app autenticadora.';
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setSubmitError(null);
    keyRef.current ??= newKey();
    try {
      await walletService.requestWithdrawal({
        amount,
        bank: bank.trim(),
        accountType,
        accountNumber: accountNumber.replace(/[\s-]/g, ''),
        holder: holder.trim(),
        holderDocument,
        idempotencyKey: keyRef.current,
        mfaCode: needMfa ? mfaCode.trim() : undefined,
      });
      keyRef.current = null;
      setMfaCode('');
      showToast('Solicitud de retiro recibida; será revisada por un administrador.', 'success');
      setAmount(0);
      setAccountNumber('');
      refresh();
      if (page === 1) loadList();
      else setPage(1);
    } catch (err) {
      const e2 = err as { message?: string; status?: number; mfaCodeRequired?: boolean };
      if (e2.mfaCodeRequired) setMfaForced(true);
      setSubmitError(e2.message ?? 'No fue posible registrar la solicitud.');
      // 422/409 son definitivos: una nueva edición debe usar clave nueva.
      if (e2.status === 422 || e2.status === 409 || e2.status === 403) keyRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title="Solicitar retiro" description="Retira tu saldo a tu cuenta bancaria, Nequi o Daviplata." backTo={{ to: '/billetera', label: 'Mi billetera' }} />

      <div className="card-surface p-5 sm:p-7">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <p className="text-sm text-text-secondary">
            Saldo disponible: <span className="font-bold text-text-primary">{formatCurrency(balance)}</span>. Al solicitar, el monto queda
            retenido hasta que un administrador apruebe o rechace el retiro (máx. {LIMITS.maxPendingWithdrawals} pendientes).
          </p>
          <FormField label="Monto a retirar (COP)" htmlFor="w-amount" error={errors.amount} hint={`Entre ${formatCurrency(LIMITS.minWithdrawal)} y ${formatCurrency(LIMITS.maxWithdrawal)}`} required>
            <Input id="w-amount" inputMode="numeric" placeholder="0" value={formatAmountInput(amount)} onChange={(e) => setAmount(parseAmount(e.target.value))} error={!!errors.amount} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Banco o billetera" htmlFor="w-bank" error={errors.bank} required>
              <Input id="w-bank" maxLength={60} placeholder="Bancolombia" value={bank} onChange={(e) => setBank(e.target.value)} error={!!errors.bank} />
            </FormField>
            <FormField label="Tipo de cuenta" htmlFor="w-type" required>
              <Select id="w-type" value={accountType} onChange={(e) => setAccountType(e.target.value as BankAccountType)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{accountTypeLabels[t]}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Número de cuenta o celular" htmlFor="w-account" error={errors.accountNumber} hint="Solo dígitos (6 a 20)" required>
            <Input id="w-account" inputMode="numeric" autoComplete="off" placeholder="12345677890" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} error={!!errors.accountNumber} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Titular de la cuenta" htmlFor="w-holder" error={errors.holder} required>
              <Input id="w-holder" maxLength={120} value={holder} onChange={(e) => setHolder(e.target.value)} error={!!errors.holder} />
            </FormField>
            <FormField label="Documento del titular" htmlFor="w-doc" error={errors.holderDocument} hint="Debe coincidir con el de tu cuenta" required>
              <Input id="w-doc" inputMode="numeric" value={holderDocument} onChange={(e) => setHolderDocument(e.target.value)} error={!!errors.holderDocument} />
            </FormField>
          </div>
          {needMfa && (
            <FormField label="Código de verificación en dos pasos" htmlFor="w-mfa" error={errors.mfaCode} hint="6 dígitos de tu app autenticadora (o un código de recuperación). Si acabas de usar este mismo código para iniciar sesión, espera al siguiente." required>
              <Input id="w-mfa" autoComplete="one-time-code" inputMode="text" placeholder="123456" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} error={!!errors.mfaCode} />
            </FormField>
          )}
          {submitError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{submitError}</p>}
          <Button type="submit" fullWidth loading={loading}>Solicitar retiro</Button>
        </form>
      </div>

      <section className="mt-8" aria-labelledby="w-list">
        <h2 id="w-list" className="mb-3 text-lg font-semibold text-text-primary">Mis solicitudes</h2>
        {listError && <ErrorMessage message={listError} onRetry={loadList} />}
        {!listError && list && list.items.length === 0 && !listLoading && (
          <EmptyState title="Aún no tienes solicitudes" description="Cuando pidas un retiro aparecerá aquí con su estado." />
        )}
        {!listError && list && list.items.length > 0 && (
          <ul className="space-y-3" aria-busy={listLoading}>
            {list.items.map((w) => (
              <li key={w.id} className="card-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-text-primary">{formatCurrency(w.amount)}</p>
                  <WithdrawalStatusBadge status={w.status} />
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {w.bank} · {accountTypeLabels[w.accountType]} · {w.accountNumber} · {w.holder}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Solicitado {formatDateTime(w.requestedAt)}
                  {w.resolvedAt ? ` · Resuelto ${formatDateTime(w.resolvedAt)}` : ''}
                </p>
                {w.status === 'rejected' && w.rejectionReason && (
                  <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    <span className="font-semibold">Motivo del rechazo:</span> {w.rejectionReason.replace(/\.$/, '')}. El monto volvió a tu saldo disponible.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {list && <Pagination page={list.page} lastPage={list.lastPage} total={list.total} onChange={setPage} disabled={listLoading} />}
      </section>
    </div>
  );
}
