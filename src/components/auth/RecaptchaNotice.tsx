import { useEffect, useState } from 'react';
import { RECAPTCHA_SITE_KEY } from '@/config/auth';
import { getRecaptchaToken } from '@/utils/recaptcha';

type Status = 'loading' | 'ready' | 'error';

const LABELS: Record<Status, string> = {
  loading: 'Cargando verificación de seguridad…',
  ready: 'Protegido por reCAPTCHA v3',
  error: 'reCAPTCHA no está disponible: desactiva bloqueadores o revisa tu conexión.',
};

const TIMEOUT_MS = 8000;

/**
 * Carga reCAPTCHA v3 al abrir la pantalla (así aparece la insignia de Google) y pide un token.
 * Que Google entregue el token no prueba que el dominio esté registrado para la clave: eso solo
 * lo confirma la verificación en el servidor (la insignia de Google muestra el error de dominio).
 */
export function RecaptchaNotice() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    let alive = true;
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS));
    Promise.race([getRecaptchaToken('verificacion'), timeout]).then(
      (token) => alive && setStatus(token ? 'ready' : 'error'),
      () => alive && setStatus('error'),
    );
    return () => {
      alive = false;
    };
  }, []);

  if (!RECAPTCHA_SITE_KEY) return null;

  const dot = status === 'ready' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-gold animate-pulse';

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-text-secondary" data-testid="recaptcha-notice">
      <p className="flex items-center gap-2" role="status" aria-live="polite">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        {LABELS[status]}
      </p>
      <p className="mt-1 text-[11px] leading-snug">
        Este sitio está protegido por reCAPTCHA y se aplican la{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-gold hover:text-gold-secondary">
          Política de privacidad
        </a>{' '}
        y las{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-gold hover:text-gold-secondary">
          Condiciones del servicio
        </a>{' '}
        de Google.
      </p>
    </div>
  );
}
