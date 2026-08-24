import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import {
  isAdult,
  isRequired,
  isStrongEnough,
  isValidDocumentId,
  isValidEmail,
  passwordsMatch,
} from '@/utils/validators';

interface FormState {
  fullName: string;
  email: string;
  documentId: string;
  birthDate: string;
  password: string;
  passwordConfirmation: string;
  acceptsTerms: boolean;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const MIN_AGE = 18;

export function Registro() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    documentId: '',
    birthDate: '',
    password: '',
    passwordConfirmation: '',
    acceptsTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!isRequired(form.fullName)) next.fullName = 'El nombre completo es obligatorio.';
    if (!isRequired(form.email)) next.email = 'El correo es obligatorio.';
    else if (!isValidEmail(form.email)) next.email = 'Ingresa un correo válido.';
    if (!isRequired(form.documentId)) next.documentId = 'La cédula es obligatoria.';
    else if (!isValidDocumentId(form.documentId)) next.documentId = 'Ingresa un número de documento válido.';
    if (!isRequired(form.birthDate)) next.birthDate = 'La fecha de nacimiento es obligatoria.';
    else if (!isAdult(form.birthDate, MIN_AGE)) next.birthDate = `Debes ser mayor de ${MIN_AGE} años para registrarte.`;
    if (!isRequired(form.password)) next.password = 'La contraseña es obligatoria.';
    else if (!isStrongEnough(form.password))
      next.password = 'Usa mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.';
    if (!passwordsMatch(form.password, form.passwordConfirmation)) next.passwordConfirmation = 'Las contraseñas no coinciden.';
    if (!form.acceptsTerms) next.acceptsTerms = 'Debes aceptar los términos y la política de privacidad.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await register(form);
      showToast('¡Cuenta creada exitosamente!', 'success');
      navigate('/');
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? 'No fue posible crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('/assets/form-backgrounds/form-bg-03.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="card-surface w-full max-w-md animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/assets/logo.png" alt="PlayBoss" className="mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">Crear cuenta</h1>
          <p className="mt-1 text-sm text-text-secondary">Completa tus datos para comenzar</p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Nombre completo" htmlFor="fullName" error={errors.fullName} required>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Ingresa tu nombre completo"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              error={!!errors.fullName}
            />
          </FormField>

          <FormField label="Correo electrónico" htmlFor="email" error={errors.email} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Ingresa tu correo electrónico"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={!!errors.email}
            />
          </FormField>

          <FormField label="Cédula de identidad" htmlFor="documentId" error={errors.documentId} required>
            <Input
              id="documentId"
              inputMode="numeric"
              placeholder="Ingresa tu número de cédula"
              value={form.documentId}
              onChange={(e) => update('documentId', e.target.value)}
              error={!!errors.documentId}
            />
          </FormField>

          <FormField label="Fecha de nacimiento" htmlFor="birthDate" error={errors.birthDate} required>
            <Input
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => update('birthDate', e.target.value)}
              error={!!errors.birthDate}
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password" error={errors.password} required>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="Crea una contraseña"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={!!errors.password}
              showStrength
            />
          </FormField>

          <FormField label="Confirmar contraseña" htmlFor="passwordConfirmation" error={errors.passwordConfirmation} required>
            <PasswordInput
              id="passwordConfirmation"
              autoComplete="new-password"
              placeholder="Confirma tu contraseña"
              value={form.passwordConfirmation}
              onChange={(e) => update('passwordConfirmation', e.target.value)}
              error={!!errors.passwordConfirmation}
            />
          </FormField>

          <div>
            <label className="flex items-start gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.acceptsTerms}
                onChange={(e) => update('acceptsTerms', e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-subtle bg-bg-secondary accent-gold"
              />
              Acepto los términos y condiciones y la política de privacidad.
            </label>
            {errors.acceptsTerms && <p className="mt-1.5 text-sm text-red-400">{errors.acceptsTerms}</p>}
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Registrarme
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-gold hover:text-gold-secondary">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
