import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { CodeInput } from '@/components/common/CodeInput';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { isMockActive } from '@/services/dataSource';
import { mockChallengeDemoCode } from '@/mocks/mfa';

const MAX_TRIES = 5;

/** Segundo paso del login: código de la app autenticadora o, si no la tienes, un código de recuperación. */
export function VerificacionDosPasos() {
  const { mfaChallenge, verifyMfa, cancelMfa } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recovery, setRecovery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tries, setTries] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => (mfaChallenge ? Math.max(0, Math.floor((mfaChallenge.expiresAt - Date.now()) / 1000)) : 0));
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const backToLogin = (message?: string) => {
    cancelMfa();
    if (message) showToast(message, 'error');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (!mfaChallenge) navigate('/login', { replace: true });
  }, [mfaChallenge, navigate]);

  useEffect(() => {
    if (!mfaChallenge) return;
    const tick = () => {
      const left = Math.floor((mfaChallenge.expiresAt - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) {
        cancelMfa();
        showToast('La verificación venció. Inicia sesión de nuevo.', 'error');
        navigate('/login', { replace: true });
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [mfaChallenge, cancelMfa, navigate, showToast]);

  useEffect(() => {
    if (!mfaChallenge || !isMockActive()) return;
    let alive = true;
    const refresh = () => mockChallengeDemoCode(mfaChallenge.token).then((c) => alive && setDemoCode(c));
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [mfaChallenge]);

  async function submit(input: { code?: string; recoveryCode?: string }) {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await verifyMfa(input);
      if (result.factor === 'recuperacion') {
        showToast(`Usaste un código de recuperación. Te quedan ${result.recoveryRemaining}; regenera tus códigos desde Perfil > Seguridad.`, 'info');
      } else {
        showToast('¡Bienvenido de nuevo!', 'success');
      }
      const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
      navigate(result.profileIncomplete ? '/completar-perfil' : from ? `${from.pathname}${from.search ?? ''}` : '/', { replace: true });
    } catch (err) {
      const e = err as { message?: string; status?: number };
      if (e.status === 401 && /^La verificación venció/.test(e.message ?? '')) {
        backToLogin(e.message);
        return;
      }
      const next = e.status === 429 ? tries : tries + 1;
      setTries(next);
      if (next >= MAX_TRIES) {
        backToLogin('Demasiados intentos fallidos. Inicia sesión de nuevo.');
        return;
      }
      setError(e.message ?? 'No fue posible verificar el código.');
      setResetKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  function handleRecovery(e: FormEvent) {
    e.preventDefault();
    if (recovery.replace(/[^A-Za-z0-9]/g, '').length < 10) {
      setError('El código de recuperación tiene 10 caracteres (por ejemplo K7M2P-9XQ4T).');
      return;
    }
    submit({ recoveryCode: recovery.trim() });
  }

  if (!mfaChallenge) return null;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div
      className="auth-page flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8 sm:py-10"
      style={{ backgroundImage: "url('/assets/form-backgrounds/form-bg-04.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="card-surface w-full max-w-md animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/assets/logo.png" alt="PlayBoss" className="mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">Verificación en dos pasos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {recoveryMode
              ? 'Ingresa uno de tus códigos de recuperación. Cada uno sirve una sola vez.'
              : 'Abre tu app autenticadora (Google Authenticator, Authy…) e ingresa el código de 6 dígitos de PlayBoss.'}
          </p>
        </div>

        {recoveryMode ? (
          <form onSubmit={handleRecovery} noValidate className="space-y-4">
            <label htmlFor="mfa-recovery" className="label-base">Código de recuperación</label>
            <Input
              id="mfa-recovery"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="XXXXX-XXXXX"
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              error={!!error}
            />
            <Button type="submit" fullWidth loading={loading}>Verificar y entrar</Button>
          </form>
        ) : (
          <>
            <CodeInput resetKey={resetKey} error={!!error} onComplete={(code) => submit({ code })} />
            {loading && <p className="mt-3 text-center text-sm text-text-secondary">Verificando…</p>}
          </>
        )}

        {error && <p role="alert" className="mt-3 text-center text-sm text-red-400">{error}</p>}
        {error && tries > 0 && tries < MAX_TRIES && (
          <p className="mt-1 text-center text-xs text-text-secondary">Intento {tries} de {MAX_TRIES}. Tras {MAX_TRIES} fallos se bloquea unos minutos.</p>
        )}
        {isMockActive() && demoCode && !recoveryMode && (
          <p className="mt-3 text-center text-xs text-gold">Modo demostración: el código vigente es {demoCode}.</p>
        )}

        <p className="mt-5 text-center text-xs text-text-secondary">
          Este paso vence en <span className="font-medium text-text-primary">{mm}:{ss}</span>
        </p>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            className="font-medium text-gold hover:text-gold-secondary"
            onClick={() => {
              setRecoveryMode((m) => !m);
              setError(null);
              setRecovery('');
            }}
          >
            {recoveryMode ? 'Usar el código de la app' : 'Usar un código de recuperación'}
          </button>
          <button type="button" className="text-text-secondary hover:text-text-primary" onClick={() => backToLogin()}>
            ← Volver a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
