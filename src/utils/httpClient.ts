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

/**
 * Cliente HTTP centralizado. Nunca se debe usar fetch/axios directamente
 * dentro de componentes: todos los servicios pasan por aquí.
 *
 * Maneja: headers comunes, token de acceso, sesión expirada (401),
 * prohibido (403) y errores de servidor (500) de forma centralizada.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
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
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
    });
  } catch {
    const networkError: ApiError = { status: 0, message: 'No fue posible conectar con el servidor.' };
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
    const err: ApiError = { status: 403, message: 'No tienes permisos para realizar esta acción.' };
    throw err;
  }

  if (response.status >= 500) {
    const err: ApiError = { status: response.status, message: 'Ocurrió un error en el servidor. Intenta más tarde.' };
    throw err;
  }

  if (!response.ok) {
    // La API responde { error, mensaje: string[], data } en vez del
    // { message, errors } genérico; se soportan ambos formatos aquí.
    let body: { message?: string; mensaje?: string[]; errors?: Record<string, string[]> } = {};
    try {
      body = await response.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    const err: ApiError = {
      status: response.status,
      message: body.message ?? (body.mensaje?.length ? body.mensaje.join(' ') : undefined) ?? 'Ocurrió un error inesperado.',
      errors: body.errors,
    };
    throw err;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
