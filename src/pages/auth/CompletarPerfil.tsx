import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { DOCUMENT_TYPES } from '@/constants/documentTypes';
import { isAdult, isRequired, isValidDocumentNumber } from '@/utils/validators';

const MIN_AGE = 18;

interface FormState {
  lastName: string;
  secondLastName: string;
  documentType: string;
  documentId: string;
  birthDate: string;
  phone: string;
}

/** Paso obligatorio para usuarios creados con Google: fecha de nacimiento (mayoría de edad) y documento. */
export function CompletarPerfil() {
  const { user, completeProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    lastName: user?.lastName ?? '',
    secondLastName: '',
    documentType: '',
    documentId: '',
    birthDate: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!isRequired(form.lastName)) next.lastName = 'El primer apellido es obligatorio.';
    if (!isRequired(form.documentType)) next.documentType = 'Selecciona un tipo de documento.';
    if (!isRequired(form.documentId)) next.documentId = 'El número de documento es obligatorio.';
    else if (!isValidDocumentNumber(form.documentType, form.documentId))
      next.documentId = 'Ingresa un número de documento válido.';
    if (!isRequired(form.birthDate)) next.birthDate = 'La fecha de nacimiento es obligatoria.';
    else if (!isAdult(form.birthDate, MIN_AGE)) next.birthDate = `Debes ser mayor de ${MIN_AGE} años.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await completeProfile({
        lastName: form.lastName.trim(),
        secondLastName: form.secondLastName.trim(),
        documentType: form.documentType,
        documentId: form.documentId.trim(),
        birthDate: form.birthDate,
        phone: form.phone.trim(),
      });
      showToast('Perfil completado.', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? 'No fue posible completar el perfil.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div
      className="auth-page flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8 sm:py-10"
      style={{
        backgroundImage: "url('/assets/form-backgrounds/form-bg-03.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="card-surface w-full max-w-lg animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/assets/logo.png" alt="PlayBoss" className="mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">Completa tu perfil</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {user?.email}. Para apostar y depositar necesitamos verificar que eres mayor de edad.
          </p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Primer apellido" htmlFor="lastName" error={errors.lastName} required>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                error={!!errors.lastName}
              />
            </FormField>
            <FormField label="Segundo apellido" htmlFor="secondLastName" hint="Opcional">
              <Input
                id="secondLastName"
                value={form.secondLastName}
                onChange={(e) => update('secondLastName', e.target.value)}
              />
            </FormField>
          </div>

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

          <FormField label="Celular" htmlFor="phone" hint="Opcional">
            <Input id="phone" inputMode="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </FormField>

          <Button type="submit" fullWidth loading={loading}>
            Guardar y continuar
          </Button>
          <button type="button" onClick={handleCancel} className="w-full text-sm text-text-secondary hover:text-gold">
            Cancelar y cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
