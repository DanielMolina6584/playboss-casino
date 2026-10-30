import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ResponsibleLimits } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { userService } from '@/services/userService';
import { formatAmountInput, formatDate, maskDocumentId, parseAmount } from '@/utils/formatters';
import { isRequired, isStrongEnough, passwordsMatch } from '@/utils/validators';

function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    middleName: user?.middleName ?? '',
    lastName: user?.lastName ?? '',
    secondLastName: user?.secondLastName ?? '',
    phone: user?.phone ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!isRequired(form.firstName)) next.firstName = 'El primer nombre es obligatorio.';
    if (!isRequired(form.lastName)) next.lastName = 'El primer apellido es obligatorio.';
    if (form.phone && !/^[0-9+\s-]{7,20}$/.test(form.phone)) next.phone = 'Ingresa un celular válido.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      updateUser(await userService.updateProfile(form));
      showToast('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      showToast((err as { message?: string })?.message ?? 'No fue posible actualizar tu perfil.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <FormField label="Primer nombre" htmlFor="firstName" error={errors.firstName} required>
        <Input id="firstName" value={form.firstName} onChange={set('firstName')} error={!!errors.firstName} />
      </FormField>
      <FormField label="Segundo nombre" htmlFor="middleName">
        <Input id="middleName" value={form.middleName} onChange={set('middleName')} />
      </FormField>
      <FormField label="Primer apellido" htmlFor="lastName" error={errors.lastName} required>
        <Input id="lastName" value={form.lastName} onChange={set('lastName')} error={!!errors.lastName} />
      </FormField>
      <FormField label="Segundo apellido" htmlFor="secondLastName">
        <Input id="secondLastName" value={form.secondLastName} onChange={set('secondLastName')} />
      </FormField>
      <FormField label="Celular" htmlFor="phone" error={errors.phone}>
        <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} error={!!errors.phone} />
      </FormField>
      <FormField label="Correo electrónico" htmlFor="email" hint="Para cambiar tu correo, contacta a soporte.">
        <Input id="email" value={user?.email ?? ''} readOnly disabled />
      </FormField>
      <div className="sm:col-span-2">
        <Button type="submit" loading={loading}>Guardar cambios</Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ current: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.current) next.current = 'Ingresa tu contraseña actual.';
    if (!isStrongEnough(form.password)) next.password = 'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.';
    else if (form.password === form.current) next.password = 'La nueva contraseña debe ser diferente a la actual.';
    if (!passwordsMatch(form.password, form.confirmation)) next.confirmation = 'Las contraseñas no coinciden.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await userService.changePassword({ currentPassword: form.current, password: form.password, passwordConfirmation: form.confirmation });
      setForm({ current: '', password: '', confirmation: '' });
      showToast('Contraseña actualizada.', 'success');
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No fue posible cambiar la contraseña.';
      setErrors({ current: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:max-w-md">
      <FormField label="Contraseña actual" htmlFor="pw-current" error={errors.current} required>
        <PasswordInput id="pw-current" autoComplete="current-password" value={form.current} onChange={set('current')} error={!!errors.current} />
      </FormField>
      <FormField label="Nueva contraseña" htmlFor="pw-new" error={errors.password} required>
        <PasswordInput id="pw-new" autoComplete="new-password" showStrength value={form.password} onChange={set('password')} error={!!errors.password} />
      </FormField>
      <FormField label="Confirmar nueva contraseña" htmlFor="pw-confirm" error={errors.confirmation} required>
        <PasswordInput id="pw-confirm" autoComplete="new-password" value={form.confirmation} onChange={set('confirmation')} error={!!errors.confirmation} />
      </FormField>
      <div>
        <Button type="submit" loading={loading}>Cambiar contraseña</Button>
      </div>
    </form>
  );
}

function LimitsForm({ userId }: { userId: string }) {
  const { showToast } = useToast();
  const [limits, setLimits] = useState<ResponsibleLimits>(() => userService.getLimits(userId));
  const fields: { key: keyof ResponsibleLimits; label: string }[] = [
    { key: 'dailyDeposit', label: 'Límite diario de depósito' },
    { key: 'weeklyDeposit', label: 'Límite semanal de depósito' },
    { key: 'dailyStake', label: 'Límite diario de apuestas' },
  ];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      userService.saveLimits(userId, limits);
      showToast('Límites guardados.', 'success');
    } catch (err) {
      showToast((err as { message?: string }).message ?? 'No fue posible guardar los límites.', 'error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
      {fields.map((f) => (
        <FormField key={f.key} label={f.label} htmlFor={`lim-${f.key}`} hint="Vacío = sin límite">
          <Input
            id={`lim-${f.key}`}
            inputMode="numeric"
            placeholder="Sin límite"
            value={formatAmountInput(limits[f.key] ?? 0)}
            onChange={(e) => setLimits((l) => ({ ...l, [f.key]: parseAmount(e.target.value) || null }))}
          />
        </FormField>
      ))}
      <div className="sm:col-span-3">
        <p className="mb-3 text-xs text-text-secondary">
          Por ahora estos límites se guardan solo en este dispositivo. <Link to="/legal/juego-responsable" className="text-gold underline">Conoce más sobre juego responsable</Link>.
        </p>
        <Button type="submit" variant="secondary">Guardar límites</Button>
      </div>
    </form>
  );
}

export function Perfil() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="container-page py-8">
      <PageHeader title="Mi perfil" description="Administra tu información personal y tu seguridad." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface h-fit p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xl font-bold text-gold" aria-hidden="true">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-primary">{user.fullName}</p>
              <p className="truncate text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-secondary">Documento</dt><dd className="text-text-primary">{maskDocumentId(user.documentId)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Nacimiento</dt><dd className="text-text-primary">{user.birthDate ? formatDate(user.birthDate) : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-secondary">Miembro desde</dt><dd className="text-text-primary">{formatDate(user.createdAt)}</dd></div>
          </dl>
          <div className="mt-5 grid gap-2">
            <Link to="/billetera" className="btn-secondary">Mi billetera</Link>
            {user.role === 'admin' && <Link to="/admin" className="btn-secondary">Panel admin</Link>}
            <Button variant="ghost" onClick={() => logout()}>Cerrar sesión</Button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface p-5 sm:p-6" aria-labelledby="sec-info">
            <h2 id="sec-info" className="mb-4 text-lg font-semibold text-text-primary">Información personal</h2>
            <ProfileForm />
          </section>
          <section className="card-surface p-5 sm:p-6" aria-labelledby="sec-pass">
            <h2 id="sec-pass" className="mb-4 text-lg font-semibold text-text-primary">Cambiar contraseña</h2>
            <PasswordForm />
          </section>
          <section className="card-surface p-5 sm:p-6" aria-labelledby="sec-lim">
            <h2 id="sec-lim" className="mb-4 text-lg font-semibold text-text-primary">Juego responsable: mis límites</h2>
            <LimitsForm userId={user.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
