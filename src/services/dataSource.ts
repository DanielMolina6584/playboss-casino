import { DATA_MODE } from '@/config/features';
import { getAccessToken } from '@/utils/httpClient';
import type { ApiError } from '@/types';

// ---------------------------------------------------------------------------
// Decide, por cada llamada, si se usa la API real o los datos simulados.
//   DATA_MODE=mock  -> siempre mock
//   DATA_MODE=api   -> siempre API (los errores se propagan)
//   DATA_MODE=auto  -> API; si no está disponible (sin red / no desplegada), se
//                      activa el mock para el resto de la sesión del navegador.
// Las páginas nunca saben cuál de los dos se usó: llaman a los servicios.
// ---------------------------------------------------------------------------

const MOCK_TOKEN_PREFIX = 'mock:';
const FALLBACK_KEY = 'playboss_mock_fallback';
const EVENT = 'playboss:mock-mode';

let fallback = false;
try {
  fallback = sessionStorage.getItem(FALLBACK_KEY) === '1';
} catch {
  /* sin sessionStorage */
}

export const mockToken = (userId: string) => `${MOCK_TOKEN_PREFIX}${userId}`;
export const isMockToken = (token: string | null) => !!token && token.startsWith(MOCK_TOKEN_PREFIX);
export const mockUserIdFromToken = (token: string | null) => (token ? token.slice(MOCK_TOKEN_PREFIX.length) : '');

export function isMockActive(): boolean {
  return DATA_MODE === 'mock' || (DATA_MODE === 'auto' && (fallback || isMockToken(getAccessToken())));
}

function activateFallback() {
  if (fallback) return;
  fallback = true;
  try {
    sessionStorage.setItem(FALLBACK_KEY, '1');
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeMockMode(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ejecuta `real` o `mock` según el modo. `mock` puede ser síncrono. */
export async function withMock<T>(real: () => Promise<T>, mock: () => T | Promise<T>, delay = 350): Promise<T> {
  const runMock = async () => {
    await wait(delay);
    return mock();
  };
  if (isMockActive()) return runMock();
  try {
    return await real();
  } catch (err) {
    if (DATA_MODE === 'auto' && (err as ApiError)?.unavailable) {
      activateFallback();
      return runMock();
    }
    throw err;
  }
}

/** Error con el mismo formato que httpClient para que las pantallas lo traten igual. */
export function mockError(message: string, status = 422): ApiError {
  return { status, message };
}

/** Id del usuario de la sesión simulada actual (solo para handlers mock). */
export function currentMockUserId(): string {
  const id = mockUserIdFromToken(getAccessToken());
  if (!id) throw mockError('Tu sesión ha expirado. Inicia sesión nuevamente.', 401);
  return id;
}
