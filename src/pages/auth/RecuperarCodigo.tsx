import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { CodeInput } from '@/components/common/CodeInput';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';

const RESEND_SECONDS = 45;

export function RecuperarCodigo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const email = (location.state as { email?: string })?.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resendKey, setResendKey] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/recuperar', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function verify(fullCode: string) {
    setError(null);
    setLoading(true);
    try {
      await authService.verifyRecoveryCode({ email, code: fullCode });
      navigate('/recuperar/nueva-contrasena', { state: { email, code: fullCode } });
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'El código ingresado no es válido.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await authService.resendRecoveryCode(email);
      setCountdown(RESEND_SECONDS);
      setResendKey((k) => k + 1);
      setCode('');
      showToast('Hemos reenviado el código a tu correo.', 'success');
    } catch {
      showToast('No fue posible reenviar el código.', 'error');
    }
  }

  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  return (
    <div
      className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/assets/form-backgrounds/form-bg-04.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="card-surface w-full max-w-md animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/assets/logo.png" alt="PlayBoss" className="mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">Verifica tu código</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ingresa el código de 6 dígitos que enviamos a tu correo.
          </p>
        </div>

        <CodeInput
          resetKey={resendKey}
          error={!!error}
          onComplete={(fullCode) => {
            setCode(fullCode);
            verify(fullCode);
          }}
        />
        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}

        <div className="mt-5 text-center text-sm text-text-secondary">
          {countdown > 0 ? (
            <p>
              Puedes solicitar un nuevo código en{' '}
              <span className="font-medium text-text-primary">
                {minutes}:{seconds}
              </span>
            </p>
          ) : (
            <p>
              ¿No recibiste el código?{' '}
              <button onClick={handleResend} className="font-medium text-gold hover:text-gold-secondary">
                Reenviar código
              </button>
            </p>
          )}
        </div>

        <Button fullWidth loading={loading} className="mt-6" onClick={() => code.length === 6 && verify(code)}>
          Verificar código
        </Button>

        <p className="mt-6 text-center text-sm">
          <Link to="/recuperar" className="font-medium text-gold hover:text-gold-secondary">
            ← Volver
          </Link>
        </p>
      </div>
    </div>
  );
}
