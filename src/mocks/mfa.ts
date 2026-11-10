import type { User } from '@/types';
import { getDb, saveDb, type MockMfa } from '@/mocks/store';
import { mockError } from '@/services/dataSource';
import { currentTotp, randomBase32Secret, verifyTotp } from '@/utils/totp';

// ---------------------------------------------------------------------------
// Simulación del 2FA del servidor para el modo mock: mismo contrato y mismas
// reglas que la API (TOTP real con ±1 ventana, un código no se reutiliza,
// 10 códigos de recuperación de un solo uso, bloqueo tras 5 fallos en 5 min,
// reto de login de 5 min y un solo uso, 2FA obligatorio para admin).
// ---------------------------------------------------------------------------

const MAX_FAILURES = 5;
const LOCK_MS = 5 * 60_000;
const CHALLENGE_MS = 5 * 60_000;
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface MockChallenge {
  userId: string;
  via: 'password' | 'google';
  expiresAt: number;
  attempts: number;
  isNew?: boolean;
}
const challenges = new Map<string, MockChallenge>();

const store = () => (getDb().mfa ??= {});
const isActive = (userId: string) => !!store()[userId]?.confirmedAt;
const roleOf = (userId: string) => getDb().users.find((u) => u.user.id === userId)?.user.role;

export const mockMfaActive = isActive;
export const mockMfaRequired = (userId: string) => roleOf(userId) === 'admin';

/** Agrega los indicadores de 2FA al usuario que ve el front (como `mfa_activo`/`mfa_obligatorio` de la API). */
export function decorateUser(user: User): User {
  return { ...user, mfaActive: isActive(user.id), mfaRequired: mockMfaRequired(user.id) };
}

/** Código TOTP vigente del usuario (solo para la ayuda de demostración en pantalla). */
export async function mockCurrentCode(userId: string): Promise<string | null> {
  const m = store()[userId];
  return m ? currentTotp(m.secret) : null;
}

function assertNotLocked(m: MockMfa | undefined) {
  if (!m) return;
  m.failures = m.failures.filter((t) => Date.now() - t < LOCK_MS);
  if (m.failures.length >= MAX_FAILURES) {
    const retry = Math.ceil((LOCK_MS - (Date.now() - m.failures[0])) / 1000);
    const err = mockError(`Demasiados intentos. Intenta de nuevo en ${Math.ceil(retry / 60)} minuto(s).`, 429);
    err.retryAfter = retry;
    throw err;
  }
}

function newRecoveryCodes(): string[] {
  const out = new Set<string>();
  while (out.size < 10) {
    const raw = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => RECOVERY_ALPHABET[b % 32]).join('');
    out.add(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return [...out];
}

const normalize = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Verifica TOTP o código de recuperación; consume lo usado. Devuelve el factor empleado. */
async function verifyFactor(userId: string, code?: string, recovery?: string, failStatus = 422, pending = false): Promise<'totp' | 'recuperacion'> {
  const m = store()[userId];
  assertNotLocked(m);
  let factor: 'totp' | 'recuperacion' | null = null;
  if (m && (pending || m.confirmedAt)) {
    if (code?.trim()) {
      const counter = await verifyTotp(m.secret, code.replace(/\s/g, ''), m.lastCounter);
      if (counter !== null) {
        m.lastCounter = counter;
        factor = 'totp';
      }
    } else if (recovery?.trim() && !pending) {
      const hit = m.recovery.find((r) => !r.used && normalize(r.code) === normalize(recovery));
      if (hit) {
        hit.used = true;
        factor = 'recuperacion';
      }
    }
  }
  if (!factor) {
    m?.failures.push(Date.now());
    saveDb();
    throw mockError('Código incorrecto o vencido.', failStatus);
  }
  m.failures = [];
  saveDb();
  return factor;
}

export function mockMfaStatus(userId: string) {
  const m = store()[userId];
  const rec = getDb().users.find((u) => u.user.id === userId);
  return {
    enabled: true,
    active: !!m?.confirmedAt,
    required: mockMfaRequired(userId),
    setupPending: !!m && !m.confirmedAt,
    recoveryRemaining: m?.confirmedAt ? m.recovery.filter((r) => !r.used).length : 0,
    confirmedAt: m?.confirmedAt ?? null,
    issuer: 'PlayBoss',
    hasPassword: !!rec?.password,
  };
}

export function mockMfaSetup(userId: string) {
  if (isActive(userId)) throw mockError('La autenticación en dos pasos ya está activa.', 409);
  const rec = getDb().users.find((u) => u.user.id === userId);
  const secret = randomBase32Secret();
  store()[userId] = { secret, confirmedAt: null, lastCounter: null, recovery: [], failures: [] };
  saveDb();
  const account = rec?.user.email ?? `usuario-${userId}`;
  return {
    secret,
    otpauthUri: `otpauth://totp/${encodeURIComponent(`PlayBoss:${account}`)}?secret=${secret}&issuer=PlayBoss&algorithm=SHA1&digits=6&period=30`,
    issuer: 'PlayBoss',
    account,
  };
}

export async function mockMfaActivate(userId: string, code: string): Promise<string[]> {
  const m = store()[userId];
  if (!m) throw mockError('Primero genera la configuración del segundo paso.', 409);
  if (m.confirmedAt) throw mockError('La autenticación en dos pasos ya está activa.', 409);
  await verifyFactor(userId, code, undefined, 422, true);
  const codes = newRecoveryCodes();
  m.confirmedAt = new Date().toISOString();
  m.recovery = codes.map((code2) => ({ code: code2, used: false }));
  saveDb();
  return codes;
}

export async function mockMfaDisable(userId: string, p: { password?: string; code?: string; recovery?: string }): Promise<void> {
  if (!isActive(userId)) throw mockError('La autenticación en dos pasos no está activa.', 409);
  if (mockMfaRequired(userId))
    throw mockError('Tu rol exige la autenticación en dos pasos; no se puede desactivar. Si perdiste el acceso, pide a otro administrador que la restablezca.', 403);
  const rec = getDb().users.find((u) => u.user.id === userId);
  if (rec?.password && rec.password !== p.password) throw mockError('La contraseña no es correcta.');
  if (!rec?.password && !p.password) throw mockError('Confirma tu identidad con Google para desactivar el 2FA.');
  await verifyFactor(userId, p.code, p.recovery);
  delete store()[userId];
  saveDb();
}

export async function mockMfaRegenerate(userId: string, code?: string, recovery?: string): Promise<string[]> {
  if (!isActive(userId)) throw mockError('La autenticación en dos pasos no está activa.', 409);
  await verifyFactor(userId, code, recovery);
  const codes = newRecoveryCodes();
  store()[userId].recovery = codes.map((c) => ({ code: c, used: false }));
  saveDb();
  return codes;
}

export function mockStartChallenge(userId: string, via: 'password' | 'google', isNew?: boolean) {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const expiresIn = CHALLENGE_MS / 1000;
  challenges.set(token, { userId, via, expiresAt: Date.now() + CHALLENGE_MS, attempts: 0, isNew });
  return { token, expiresIn, via, isNew };
}

export async function mockCompleteChallenge(token: string, code?: string, recovery?: string) {
  const ch = challenges.get(token);
  if (!ch || ch.expiresAt < Date.now()) {
    challenges.delete(token);
    throw mockError('La verificación venció o es inválida. Inicia sesión de nuevo.', 401);
  }
  try {
    const factor = await verifyFactor(ch.userId, code, recovery, 401);
    challenges.delete(token);
    const m = store()[ch.userId];
    return { ...ch, factor, recoveryRemaining: m.recovery.filter((r) => !r.used).length };
  } catch (err) {
    if ((err as { status?: number }).status === 401 && ++ch.attempts >= MAX_FAILURES) challenges.delete(token);
    throw err;
  }
}

/** Paso extra al retirar: con 2FA activo exige un código vigente. */
export async function mockWithdrawalStep(userId: string, code?: string, recovery?: string): Promise<void> {
  if (!isActive(userId)) {
    if (mockMfaRequired(userId)) throw Object.assign(mockError('Debes activar la autenticación en dos pasos para continuar.', 403), { mfaRequired: true });
    return;
  }
  if (!code?.trim() && !recovery?.trim())
    throw Object.assign(mockError('Ingresa el código de tu app autenticadora para solicitar el retiro.', 403), { mfaCodeRequired: true });
  await verifyFactor(userId, code, recovery);
}

/** Un admin sin 2FA no puede usar /admin/* (403 con mfaRequired), igual que la API. */
export function mockRequireAdminMfa(userId: string): void {
  if (mockMfaRequired(userId) && !isActive(userId)) {
    window.dispatchEvent(new CustomEvent('playboss:mfa-required'));
    throw Object.assign(mockError('Debes activar la autenticación en dos pasos para usar esta función.', 403), { mfaRequired: true });
  }
}

export function mockAdminResetMfa(adminId: string, userId: string, reason: string): { tenia: boolean } {
  if (reason.trim().length < 5) throw mockError('El motivo es obligatorio (mínimo 5 caracteres).');
  if (adminId === userId) throw mockError('No puedes restablecer tu propio 2FA; pídeselo a otro administrador.');
  if (!getDb().users.some((u) => u.user.id === userId)) throw mockError('Usuario no encontrado.', 404);
  const tenia = !!store()[userId];
  delete store()[userId];
  saveDb();
  return { tenia };
}

/** Solo demostración: código vigente del usuario dueño de un reto pendiente. */
export async function mockChallengeDemoCode(token: string): Promise<string | null> {
  const ch = challenges.get(token);
  return ch ? mockCurrentCode(ch.userId) : null;
}
