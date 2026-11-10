import { useEffect, useRef, useState } from 'react';
import { DATA_MODE } from '@/config/features';
import { GOOGLE_CLIENT_ID, MOCK_GOOGLE_CREDENTIAL } from '@/config/auth';
import { loadGoogleIdentity } from '@/utils/googleIdentity';

interface Props {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

/**
 * "Continuar con Google". Con VITE_GOOGLE_CLIENT_ID usa el botón oficial de
 * Google Identity Services; sin él se oculta, salvo en VITE_DATA_MODE=mock donde
 * muestra un botón simulado para poder probar el flujo sin Google.
 */
export function GoogleSignInButton({ onCredential, disabled }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((id) => {
        if (cancelled || !holder.current) return;
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => {
            if (r.credential) callback.current(r.credential);
          },
        });
        holder.current.innerHTML = '';
        id.renderButton(holder.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'es',
          width: Math.min(holder.current.offsetWidth || 320, 400),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (GOOGLE_CLIENT_ID) {
    if (failed) return null;
    return (
      <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
        <div ref={holder} className="flex min-h-[44px] w-full justify-center" data-testid="google-button" />
      </div>
    );
  }

  if (DATA_MODE === 'mock') {
    return (
      <button
        type="button"
        className="btn-secondary w-full"
        disabled={disabled}
        onClick={() => onCredential(MOCK_GOOGLE_CREDENTIAL)}
      >
        Continuar con Google (simulado)
      </button>
    );
  }

  return null;
}

