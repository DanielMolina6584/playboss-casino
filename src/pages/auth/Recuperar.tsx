import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { isRequired, isValidEmail } from '@/utils/validators';

export function Recuperar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!isRequired(email)) {
      setError('El correo es obligatorio.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Ingresa un correo válido.');
      return;
    }
    setError(null);

    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      setTimeout(() => navigate('/recuperar/codigo', { state: { email } }), 900);
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? 'No fue posible enviar el código.');
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-2xl font-bold text-text-primary">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ingresa tu correo electrónico y te enviaremos un código de verificación.
          </p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        {sent ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Código enviado correctamente. Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField label="Correo electrónico" htmlFor="email" error={error ?? undefined} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
              />
            </FormField>

            <Button type="submit" fullWidth loading={loading}>
              Enviar código
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-gold hover:text-gold-secondary">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
