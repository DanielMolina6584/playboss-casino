import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { FormField } from '@/components/common/FormField';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { isStrongEnough, passwordsMatch } from '@/utils/validators';

export function RecuperarNuevaContrasena() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; code?: string } | null;

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{ password?: string; passwordConfirmation?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!state?.email || !state?.code) {
      navigate('/recuperar', { replace: true });
    }
  }, [state, navigate]);

  function validate() {
    const next: typeof errors = {};
    if (!isStrongEnough(password)) {
      next.password = 'Usa mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.';
    }
    if (!passwordsMatch(password, passwordConfirmation)) {
      next.passwordConfirmation = 'Las contraseñas no coinciden.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate() || !state?.email || !state?.code) return;

    setLoading(true);
    try {
      await authService.resetPassword({
        email: state.email,
        code: state.code,
        password,
        passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? 'No fue posible actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/assets/form-backgrounds/form-bg-05.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="card-surface w-full max-w-md animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/assets/logo.png" alt="PlayBoss" className="mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">
            {success ? 'Contraseña actualizada' : 'Crear nueva contraseña'}
          </h1>
        </div>

        {success ? (
          <div className="text-center">
            <p className="mb-6 text-sm text-text-secondary">
              Tu contraseña ha sido actualizada correctamente.
            </p>
            <Button fullWidth onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          </div>
        ) : (
          <>
            {submitError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <FormField label="Nueva contraseña" htmlFor="password" error={errors.password} required>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="Crea una nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  showStrength
                />
              </FormField>

              <FormField
                label="Confirmar contraseña"
                htmlFor="passwordConfirmation"
                error={errors.passwordConfirmation}
                required
              >
                <PasswordInput
                  id="passwordConfirmation"
                  autoComplete="new-password"
                  placeholder="Confirma tu nueva contraseña"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  error={!!errors.passwordConfirmation}
                />
              </FormField>

              <Button type="submit" fullWidth loading={loading}>
                Actualizar contraseña
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
