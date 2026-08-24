import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { userService } from '@/services/userService';
import { maskDocumentId } from '@/utils/formatters';
import { isRequired, isValidEmail } from '@/utils/validators';

export function Perfil() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!isRequired(fullName)) next.fullName = 'El nombre es obligatorio.';
    if (!isValidEmail(email)) next.email = 'Ingresa un correo válido.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await userService.updateProfile(user!, { fullName, email });
      showToast('Perfil actualizado correctamente.', 'success');
    } catch {
      showToast('No fue posible actualizar tu perfil.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Mi perfil</h1>
      <p className="mt-1 text-sm text-text-secondary">Administra tu información personal.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-xl font-bold text-gold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{user.fullName}</p>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Cédula</dt>
              <dd className="text-text-primary">{maskDocumentId(user.documentId)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Miembro desde</dt>
              <dd className="text-text-primary">{new Date(user.createdAt).toLocaleDateString('es-CO')}</dd>
            </div>
          </dl>
        </div>

        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Editar información</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField label="Nombre completo" htmlFor="fullName" error={errors.fullName} required>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} error={!!errors.fullName} />
            </FormField>
            <FormField label="Correo electrónico" htmlFor="email" error={errors.email} required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
              />
            </FormField>
            <Button type="submit" loading={loading}>
              Guardar cambios
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
