import type { ApiError } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const ACCESS_TOKEN_KEY = 'playboss_access_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

/** Sobre de respuesta común de la API: { error, mensaje[], data }. */
export interface ApiEnvelope<T> {
  error: 0 | 1;
  mensaje: string[];
  data: T;
}

export interface ApiPage<T> {
  items: T[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

/**
 * Cliente HTTP centralizado. Nunca se debe usar fetch/axios directamente
 * dentro de componentes: todos los servicios pasan por aquí.
 *
 * Maneja: headers comunes, token de acceso, sesión expirada (401),
 * prohibido (403) y errores de servidor (500) de forma centralizada.
 * Marca `unavailable: true` cuando la API no está accesible (sin red, 404 HTML,
 * 502/503/504) para que services/dataSource pueda caer a datos simulados.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  // Con FormData (multipart) el navegador fija el Content-Type con su boundary.
  const isForm = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  const finalHeaders: HeadersInit = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    ...headers,
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      (finalHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: finalHeaders });
  } catch {
    const networkError: ApiError = {
      status: 0,
      message: 'No fue posible conectar con el servidor.',
      unavailable: true,
    };
    throw networkError;
  }

  // Un 401 solo implica "sesión expirada" cuando la petición iba autenticada
  // (auth !== false). En endpoints públicos (login, registro) un 401 es un
  // error de credenciales normal y se maneja como cualquier otro error abajo.
  if (response.status === 401 && auth) {
    setAccessToken(null);
    window.dispatchEvent(new CustomEvent('playboss:session-expired'));
    const err: ApiError = { status: 401, message: 'Tu sesión ha expirado. Inicia sesión nuevamente.' };
    throw err;
  }

  if (response.status === 403) {
    let detail: string | undefined;
    try {
      detail = ((await response.json()) as { mensaje?: string[] }).mensaje?.join(' ');
    } catch {
      /* sin cuerpo JSON */
    }
    const err: ApiError = { status: 403, message: detail || 'No tienes permisos para realizar esta acción.' };
    throw err;
  }

  if (response.status >= 500) {
    // Si la API respondió con su sobre { error, mensaje[] } (p. ej. 503 de /contacto, 502 de
    // Wompi) el servidor SÍ está disponible: se muestra su mensaje y no se cae a mock.
    let apiMessage: string | undefined;
    try {
      const b = (await response.json()) as { error?: number; mensaje?: string[] };
      if (b.error === 1 && b.mensaje?.length) apiMessage = b.mensaje.join(' ');
    } catch {
      /* cuerpo no JSON: proxy / servidor caído */
    }
    const err: ApiError = {
      status: response.status,
      message: apiMessage ?? 'Ocurrió un error en el servidor. Intenta más tarde.',
      unavailable: !apiMessage && [502, 503, 504].includes(response.status),
    };
    throw err;
  }

  if (!response.ok) {
    // La API responde { error, mensaje: string[], data } en vez del
    // { message, errors } genérico; se soportan ambos formatos aquí.
    let body: {
      message?: string;
      mensaje?: string[];
      errors?: Record<string, string[]>;
      data?: { errores?: Record<string, string[]>; retry_after?: string | number } | unknown[];
    } = {};
    let jsonBody = true;
    try {
      body = await response.json();
    } catch {
      jsonBody = false; // p. ej. HTML 404 del servidor web: la API no está desplegada
    }
    const data = body.data && !Array.isArray(body.data) ? body.data : undefined;
    const errors = body.errors ?? data?.errores;
    const fieldErrors = errors ? Object.values(errors).flat() : [];
    const retryAfter = Number(data?.retry_after ?? response.headers.get('Retry-After'));
    const err: ApiError = {
      status: response.status,
      message:
        body.mensaje?.length
          ? body.mensaje.join(' ')
          : (fieldErrors[0] ?? body.message ?? 'Ocurrió un error inesperado.'),
      errors,
      retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      unavailable: !jsonBody && response.status === 404,
    };
    throw err;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    const err: ApiError = { status: response.status, message: 'Respuesta inválida del servidor.', unavailable: true };
    throw err;
  }
}

/** Arma "?a=1&b=2" omitiendo valores vacíos. */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

function encodeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  return typeof FormData !== 'undefined' && body instanceof FormData ? body : JSON.stringify(body);
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: encodeBody(body) }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: encodeBody(body) }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
