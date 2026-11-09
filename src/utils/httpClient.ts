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
  /** 'blob' devuelve el cuerpo como archivo (imágenes) en vez de JSON. */
  responseType?: 'json' | 'blob';
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
  const { auth = true, headers, responseType = 'json', ...rest } = options;

  // Con FormData el navegador pone el Content-Type multipart con su boundary.
  const finalHeaders: HeadersInit = {
    ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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
    const err: ApiError = { status: 403, message: 'No tienes permisos para realizar esta acción.' };
    throw err;
  }

  if (response.status >= 500) {
    const err: ApiError = {
      status: response.status,
      message: 'Ocurrió un error en el servidor. Intenta más tarde.',
      unavailable: [502, 503, 504].includes(response.status),
    };
    throw err;
  }

  if (!response.ok) {
    // La API responde { error, mensaje: string[], data } en vez del
    // { message, errors } genérico; se soportan ambos formatos aquí.
    let body: { message?: string; mensaje?: string[]; errors?: Record<string, string[]> } = {};
    let jsonBody = true;
    try {
      body = await response.json();
    } catch {
      jsonBody = false; // p. ej. HTML 404 del servidor web: la API no está desplegada
    }
    const fieldErrors = body.errors ? Object.values(body.errors).flat() : [];
    const err: ApiError = {
      status: response.status,
      message:
        body.mensaje?.length
          ? body.mensaje.join(' ')
          : (fieldErrors[0] ?? body.message ?? 'Ocurrió un error inesperado.'),
      errors: body.errors,
      unavailable: !jsonBody && response.status === 404,
    };
    throw err;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === 'blob') {
    return (await response.blob()) as T;
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

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  /** POST multipart/form-data (subida de archivos). */
  postForm: <T>(path: string, form: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: form }),
  /** GET de un archivo binario (p. ej. la foto de perfil). */
  getBlob: (path: string, options?: RequestOptions) => request<Blob>(path, { ...options, method: 'GET', responseType: 'blob' }),
};
