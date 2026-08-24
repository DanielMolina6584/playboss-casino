import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { isRequired, isValidEmail } from '@/utils/validators';

interface FormErrors {
  email?: string;
  password?: string;
}

export function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!isRequired(email)) next.email = 'El correo es obligatorio.';
    else if (!isValidEmail(email)) next.email = 'Ingresa un correo válido.';
    if (!isRequired(password)) next.password = 'La contraseña es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email, password, remember });
      showToast('¡Bienvenido de nuevo!', 'success');
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/assets/form-backgrounds/form-bg-02.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="card-surface w-full max-w-md animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/assets/logo.png" alt="PlayBoss" className="mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-text-secondary">Ingresa tus datos para continuar</p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Correo electrónico" htmlFor="email" error={errors.email} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password" error={errors.password} required>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
            />
          </FormField>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle bg-bg-secondary accent-gold"
              />
              Recordarme
            </label>
            <Link to="/recuperar" className="text-sm font-medium text-gold hover:text-gold-secondary">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-gold hover:text-gold-secondary">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
