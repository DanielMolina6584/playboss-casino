import type { PaymentMethodCode, PaymentStatus, PaymentTransaction, WompiCheckout } from '@/types';
import { httpClient, type ApiEnvelope } from '@/utils/httpClient';
import { currentMockUserId, mockError, withMock } from '@/services/dataSource';
import { getDb, postMovement, saveDb } from '@/mocks/store';

// Contrato: POST /pagos/depositos, GET /pagos/{referencia} (docs/CONTRATOS-API.md)

const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';
const LAST_REF_KEY = 'playboss_last_payment_ref';

interface ApiCheckout {
  public_key: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  signature_integrity: string;
  redirect_url?: string | null;
  checkout_url?: string;
}
interface ApiTransaccion {
  referencia: string;
  estado: string;
  monto: string | number;
  moneda: string;
  tipo: string;
  creada_en: string;
  confirmada_en?: string | null;
  checkout?: ApiCheckout | null;
  checkout_url?: string | null;
}

export const paymentMethods: { code: PaymentMethodCode; label: string; hint: string }[] = [
  { code: 'WOMPI_CARD', label: 'Tarjeta débito / crédito', hint: 'Visa, Mastercard y más' },
  { code: 'NEQUI', label: 'Nequi', hint: 'Aprueba desde tu app Nequi' },
  { code: 'PSE', label: 'PSE', hint: 'Débito desde tu banco' },
];

export function mapPaymentStatus(estado: string): PaymentStatus {
  switch (estado.toUpperCase()) {
    case 'APROBADA':
    case 'APPROVED':
      return 'approved';
    case 'DECLINED':
    case 'RECHAZADA':
      return 'declined';
    case 'PENDIENTE':
    case 'PENDING':
      return 'pending';
    default:
      return 'error'; // FAILED, CANCELLED, ERROR, VOIDED...
  }
}

/**
 * Arma la URL del Web Checkout de Wompi:
 * https://checkout.wompi.co/p/?public-key&currency&amount-in-cents&reference&signature:integrity&redirect-url
 */
export function buildWompiUrl(c: Omit<WompiCheckout, 'checkoutUrl'>): string {
  const redirect = c.redirectUrl || `${window.location.origin}/billetera/recarga/resultado`;
  const q = new URLSearchParams({
    'public-key': c.publicKey,
    currency: c.currency,
    'amount-in-cents': String(c.amountInCents),
    reference: c.reference,
    'signature:integrity': c.signature,
    'redirect-url': redirect,
  });
  return `${WOMPI_CHECKOUT_URL}?${q.toString()}`;
}

function mapTransaccion(t: ApiTransaccion): PaymentTransaction {
  const c = t.checkout;
  const checkout: WompiCheckout | undefined = c
    ? {
        publicKey: c.public_key,
        reference: c.reference,
        amountInCents: c.amount_in_cents,
        currency: c.currency,
        signature: c.signature_integrity,
        redirectUrl: c.redirect_url ?? null,
        checkoutUrl: '',
      }
    : undefined;
  if (checkout) checkout.checkoutUrl = buildWompiUrl(checkout);
  return {
    reference: t.referencia,
    type: t.tipo === 'RETIRO' ? 'withdrawal' : 'deposit',
    amount: Number(t.monto),
    currency: t.moneda,
    status: mapPaymentStatus(t.estado),
    createdAt: t.creada_en,
    confirmedAt: t.confirmada_en ?? null,
    checkout,
  };
}

export function rememberReference(reference: string): void {
  try {
    sessionStorage.setItem(LAST_REF_KEY, reference);
  } catch {
    /* noop */
  }
}
export function recallReference(): string | null {
  try {
    return sessionStorage.getItem(LAST_REF_KEY);
  } catch {
    return null;
  }
}

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `dep-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function applyMockOutcome(p: ReturnType<typeof getDb>['payments'][string]) {
  if (p.status !== 'pending' || !p.outcome || p.outcome === 'pending') return;
  p.status = p.outcome;
  p.confirmedAt = new Date().toISOString();
  if (p.status === 'approved' && !p.credited) {
    p.credited = true;
    postMovement(p.userId, 'deposit', p.amount, { available: p.amount }, 'Depósito confirmado (pasarela simulada)');
  }
  saveDb();
}

export const paymentsService = {
  /** Crea el depósito y devuelve los datos de checkout (o el simulador en mock). */
  createDeposit(amount: number, method: PaymentMethodCode, idempotencyKey: string = newKey()): Promise<PaymentTransaction> {
    return withMock(
      async () => {
        const res = await httpClient.post<ApiEnvelope<ApiTransaccion>>('/pagos/depositos', {
          monto: String(amount),
          idempotency_key: idempotencyKey,
          metodo: method, // informativo: la API actual ignora campos extra
        });
        const tx = mapTransaccion(res.data);
        rememberReference(tx.reference);
        return tx;
      },
      () => {
        const db = getDb();
        const userId = currentMockUserId();
        const existing = Object.values(db.payments).find((p) => p.userId === userId && p.key === idempotencyKey);
        if (existing) return existing;
        const reference = `PB-DEP-${Date.now().toString(36).toUpperCase()}`;
        const tx = {
          reference,
          type: 'deposit' as const,
          amount,
          currency: 'COP',
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          simulated: true,
          userId,
          key: idempotencyKey,
          checkout: {
            publicKey: 'pub_test_simulado',
            reference,
            amountInCents: amount * 100,
            currency: 'COP',
            signature: 'simulada',
            checkoutUrl: `/billetera/recarga/simulador?referencia=${reference}`,
          },
        };
        db.payments[reference] = tx;
        saveDb();
        rememberReference(reference);
        return tx;
      },
      500,
    );
  },

  getStatus(reference: string): Promise<PaymentTransaction> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiTransaccion>>(`/pagos/${encodeURIComponent(reference)}`);
        return mapTransaccion(res.data);
      },
      () => {
        const p = getDb().payments[reference];
        if (!p || p.userId !== currentMockUserId()) throw mockError('Transacción no encontrada.', 404);
        applyMockOutcome(p);
        return p;
      },
      250,
    );
  },

  /** Solo modo mock: la pasarela simulada define el resultado de la transacción. */
  async simulateOutcome(reference: string, outcome: PaymentStatus): Promise<void> {
    const p = getDb().payments[reference];
    if (!p) throw mockError('Transacción no encontrada.', 404);
    p.outcome = outcome;
    applyMockOutcome(p);
    saveDb();
  },
};
