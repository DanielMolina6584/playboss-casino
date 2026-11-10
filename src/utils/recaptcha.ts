import { RECAPTCHA_SITE_KEY } from '@/config/auth';
import type { ApiError } from '@/types';

interface Grecaptcha {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('recaptcha-script'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Obtiene un token reCAPTCHA v3 para la acción indicada (login, registro,
 * recuperar, restablecer). Sin VITE_RECAPTCHA_SITE_KEY devuelve undefined y no
 * carga nada. Con clave, si Google no carga lanza un error legible.
 */
export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY) return undefined;
  try {
    await loadScript();
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) throw new Error('recaptcha-missing');
    await new Promise<void>((resolve) => grecaptcha.ready(resolve));
    return await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
  } catch {
    const err: ApiError = {
      status: 0,
      message: 'No se pudo verificar reCAPTCHA. Revisa tu conexión o desactiva bloqueadores e intenta de nuevo.',
    };
    throw err;
  }
}
