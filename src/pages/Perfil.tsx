import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LimitKey, LimitPeriod, LimitType, ResponsibleLimits, SelfExclusionDays } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/EmptyState';
import { userService } from '@/services/userService';
import { limitsService, SELF_EXCLUSION_OPTIONS, type LimitChanges } from '@/services/limitsService';
import { LIMIT_KEYS } from '@/mocks/limits';
import { formatAmountInput, formatCurrency, formatDate, formatDateTime, maskDocumentId, parseAmount } from '@/utils/formatters';
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

const LIMIT_ROWS: { type: LimitType; title: string }[] = [
  { type: 'deposit', title: 'Depósitos' },
  { type: 'stake', title: 'Apuestas' },
];
const PERIODS: { period: LimitPeriod; label: string }[] = [
  { period: 'daily', label: 'Diario' },
  { period: 'weekly', label: 'Semanal' },
  { period: 'monthly', label: 'Mensual' },
];

function LimitsForm() {
  const { showToast } = useToast();
  const [data, setData] = useState<ResponsibleLimits | null>(null);
  const [values, setValues] = useState<Record<LimitKey, number>>({} as Record<LimitKey, number>);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<SelfExclusionDays>(7);
  const [confirmExclusion, setConfirmExclusion] = useState(false);

  const apply = useCallback((r: ResponsibleLimits) => {
    setData(r);
    setValues(Object.fromEntries(LIMIT_KEYS.map((k) => [k, r.limits[k] ?? 0])) as Record<LimitKey, number>);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      apply(await limitsService.getGameLimits());
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No fue posible cargar tus límites.');
    }
  }, [apply]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(changes: LimitChanges, okMessage: string) {
    setSaving(true);
    try {
      apply(await limitsService.updateGameLimits(changes));
      showToast(okMessage, 'success');
    } catch (err) {
      showToast((err as { message?: string }).message ?? 'No fue posible guardar los límites.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    // PUT parcial: solo las claves modificadas; 0 / vacío = quitar el límite (null).
    const changes: LimitChanges = {};
    LIMIT_KEYS.forEach((k) => {
      const next = values[k] > 0 ? values[k] : null;
      if (next !== data.limits[k]) changes[k] = next;
    });
    if (!Object.keys(changes).length) {
      showToast('No hay cambios para guardar.', 'info');
      return;
    }
    save(changes, 'Límites guardados.');
  }

  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!data) return <div className="flex justify-center py-8"><Loading /></div>;

  const excl = data.selfExclusion;
  return (
    <div className="space-y-6">
      {excl.active && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <strong>Autoexclusión activa</strong> hasta {excl.until ? formatDateTime(excl.until) : 'nueva orden'}. No puedes apostar ni
          recargar saldo durante este periodo, y no se puede acortar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {LIMIT_ROWS.map((row) => (
          <fieldset key={row.type} className="grid gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-sm font-semibold text-text-primary">Límites de {row.title.toLowerCase()}</legend>
            {PERIODS.map(({ period, label }) => {
              const key = `${row.type}_${period}` as LimitKey;
              const u = data.usage[key];
              return (
                <FormField key={key} label={label} htmlFor={`lim-${key}`}>
                  <Input
                    id={`lim-${key}`}
                    inputMode="numeric"
                    placeholder="Sin límite"
                    value={values[key] ? formatAmountInput(values[key]) : ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: parseAmount(e.target.value) }))}
                  />
                  {u && (
                    <p className="mt-1.5 text-xs text-text-secondary" data-testid={`usage-${key}`}>
                      Consumido {formatCurrency(u.used)} · Disponible{' '}
                      <span className="font-semibold text-text-primary">{u.available === null ? 'sin límite' : formatCurrency(u.available)}</span>
                    </p>
                  )}
                </FormField>
              );
            })}
          </fieldset>
        ))}
        <p className="text-xs text-text-secondary">
          Vacío = sin límite. Cada periodo se mide por calendario (día, semana desde el lunes, mes). El semanal no puede ser menor que el diario, ni el mensual que el semanal.{' '}
          <Link to="/legal/juego-responsable" className="text-gold underline">Conoce más sobre juego responsable</Link>.
        </p>
        <Button type="submit" variant="secondary" loading={saving}>Guardar límites</Button>
      </form>

      <div className="border-t border-border-subtle pt-5">
        <h3 className="text-sm font-semibold text-text-primary">Autoexclusión</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Si necesitas una pausa, bloquea apuestas y recargas por un tiempo. No puedes revertirla ni acortarla.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[10rem]">
            <label htmlFor="excl-days" className="label-base">Duración</label>
            <Select id="excl-days" value={days} onChange={(e) => setDays(Number(e.target.value) as SelfExclusionDays)}>
              {SELF_EXCLUSION_OPTIONS.map((o) => (
                <option key={o.days} value={o.days}>{o.label}</option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" onClick={() => setConfirmExclusion(true)} disabled={saving}>Autoexcluirme</Button>
        </div>
      </div>

      <Modal isOpen={confirmExclusion} onClose={() => setConfirmExclusion(false)} title="Confirmar autoexclusión">
        <p className="text-sm text-text-secondary">
          Durante <strong className="text-text-primary">{SELF_EXCLUSION_OPTIONS.find((o) => o.days === days)?.label}</strong> no podrás
          apostar ni recargar. Esta decisión no se puede deshacer.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirmExclusion(false)}>Cancelar</Button>
          <Button
            loading={saving}
            onClick={async () => {
              await save({ selfExclusionDays: days }, 'Autoexclusión activada.');
              setConfirmExclusion(false);
            }}
          >
            Sí, autoexcluirme
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function Perfil() {
  const { user, logout } = useAuth();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
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
          <section id="limites" className="card-surface p-5 sm:p-6" aria-labelledby="sec-lim">
            <h2 id="sec-lim" className="mb-4 text-lg font-semibold text-text-primary">Juego responsable: mis límites</h2>
            <LimitsForm />
          </section>
        </div>
      </div>
    </div>
  );
}
