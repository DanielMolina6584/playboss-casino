import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { DOCUMENT_TYPES } from '@/constants/documentTypes';
import {
  isAdult,
  isRequired,
  isStrongEnough,
  isValidDocumentNumber,
  isValidEmail,
  passwordsMatch,
} from '@/utils/validators';
import type { RegisterPayload } from '@/types';

type FormErrors = Partial<Record<keyof RegisterPayload, string>>;

const MIN_AGE = 18;

const INITIAL_FORM: RegisterPayload = {
  firstName: '',
  middleName: '',
  lastName: '',
  secondLastName: '',
  documentType: '',
  documentId: '',
  email: '',
  birthDate: '',
  password: '',
  passwordConfirmation: '',
  acceptsTerms: false,
};

export function Registro() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterPayload>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!isRequired(form.firstName)) next.firstName = 'El primer nombre es obligatorio.';
    if (!isRequired(form.lastName)) next.lastName = 'El primer apellido es obligatorio.';
    if (!isRequired(form.documentType)) next.documentType = 'Selecciona un tipo de documento.';
    if (!isRequired(form.email)) next.email = 'El correo es obligatorio.';
    else if (!isValidEmail(form.email)) next.email = 'Ingresa un correo válido.';
    if (!isRequired(form.documentId)) next.documentId = 'El número de documento es obligatorio.';
    else if (!isValidDocumentNumber(form.documentType, form.documentId))
      next.documentId = 'Ingresa un número de documento válido.';
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
      <div className="card-surface w-full max-w-lg animate-fade-in p-6 sm:p-8">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Primer nombre" htmlFor="firstName" error={errors.firstName} required>
              <Input
                id="firstName"
                autoComplete="given-name"
                placeholder="Ej. Daniel"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                error={!!errors.firstName}
              />
            </FormField>

            <FormField label="Segundo nombre" htmlFor="middleName" error={errors.middleName} hint="Opcional">
              <Input
                id="middleName"
                autoComplete="additional-name"
                placeholder="Ej. Andrés"
                value={form.middleName}
                onChange={(e) => update('middleName', e.target.value)}
                error={!!errors.middleName}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Primer apellido" htmlFor="lastName" error={errors.lastName} required>
              <Input
                id="lastName"
                autoComplete="family-name"
                placeholder="Ej. Molina"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                error={!!errors.lastName}
              />
            </FormField>

            <FormField label="Segundo apellido" htmlFor="secondLastName" error={errors.secondLastName} hint="Opcional">
              <Input
                id="secondLastName"
                autoComplete="family-name"
                placeholder="Ej. Castañeda"
                value={form.secondLastName}
                onChange={(e) => update('secondLastName', e.target.value)}
                error={!!errors.secondLastName}
              />
            </FormField>
          </div>

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,160px)_1fr]">
            <FormField label="Tipo de documento" htmlFor="documentType" error={errors.documentType} required>
              <Select
                id="documentType"
                value={form.documentType}
                onChange={(e) => update('documentType', e.target.value)}
                error={!!errors.documentType}
              >
                <option value="" disabled>
                  Selecciona
                </option>
                {DOCUMENT_TYPES.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Número de documento" htmlFor="documentId" error={errors.documentId} required>
              <Input
                id="documentId"
                inputMode="text"
                placeholder="Ingresa tu número de documento"
                value={form.documentId}
                onChange={(e) => update('documentId', e.target.value)}
                error={!!errors.documentId}
              />
            </FormField>
          </div>

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
