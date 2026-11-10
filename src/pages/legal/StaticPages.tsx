import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import { contactService } from '@/services/contactService';
import { isRequired, isValidEmail } from '@/utils/validators';
import { LIMITS } from '@/config/limits';
import { formatCurrency } from '@/utils/formatters';

// Contenido provisional: debe ser revisado por el área legal antes de producción.

function Doc({ title, updated = 'Octubre de 2026', children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title={title} description={`Última actualización: ${updated}`} />
      <div className="card-surface space-y-6 p-5 text-sm leading-relaxed text-text-secondary sm:p-8 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-text-primary [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
      <p className="mt-6 text-xs text-text-secondary">
        Documento informativo de carácter provisional. Para dudas escribe a <Link to="/contacto" className="text-gold underline">soporte</Link>.
      </p>
    </div>
  );
}

const S = ({ h, children }: { h: string; children: ReactNode }) => (
  <section>
    <h2>{h}</h2>
    {children}
  </section>
);

export function Terminos() {
  return (
    <Doc title="Términos y condiciones">
      <S h="1. Aceptación">
        <p>Al registrarte y usar PlayBoss aceptas estos términos. Si no estás de acuerdo, no uses la plataforma.</p>
      </S>
      <S h="2. Elegibilidad">
        <p>Debes ser mayor de 18 años, residir en Colombia y registrar datos verdaderos. Una persona solo puede tener una cuenta.</p>
      </S>
      <S h="3. Apuestas">
        <ul>
          <li>Las cuotas se congelan al momento de confirmar la apuesta.</li>
          <li>Monto por apuesta: entre {formatCurrency(LIMITS.minStake)} y {formatCurrency(LIMITS.maxStake)}.</li>
          <li>Hasta {LIMITS.maxSelections} selecciones por combinada, una por partido.</li>
          <li>Puedes cancelar una apuesta pendiente solo antes de que inicie alguno de sus partidos.</li>
        </ul>
      </S>
      <S h="4. Depósitos y retiros">
        <p>
          Los depósitos se procesan mediante Wompi y se acreditan cuando el pago es aprobado. Monto mínimo de recarga:{' '}
          {formatCurrency(LIMITS.minDeposit)}.
        </p>
      </S>
      <S h="5. Responsabilidad">
        <p>PlayBoss puede suspender cuentas ante fraude, suplantación o incumplimiento de estos términos.</p>
      </S>
    </Doc>
  );
}

export function Privacidad() {
  return (
    <Doc title="Política de privacidad">
      <S h="Datos que recopilamos">
        <p>Datos de identificación, contacto, fecha de nacimiento, historial de apuestas y transacciones.</p>
      </S>
      <S h="Para qué los usamos">
        <ul>
          <li>Verificar tu identidad y mayoría de edad.</li>
          <li>Procesar apuestas, depósitos y retiros.</li>
          <li>Prevenir fraude y promover el juego responsable.</li>
        </ul>
      </S>
      <S h="Tus derechos">
        <p>Puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos (Ley 1581 de 2012) escribiendo a soporte.</p>
      </S>
      <S h="Terceros">
        <p>Compartimos información estrictamente necesaria con proveedores de pago (Wompi). No vendemos tus datos.</p>
      </S>
    </Doc>
  );
}

export function Cookies() {
  return (
    <Doc title="Política de cookies">
      <S h="Qué almacenamos">
        <p>
          PlayBoss usa almacenamiento local del navegador únicamente para mantener tu sesión, tu cupón de apuestas y tus preferencias.
          No usamos cookies publicitarias.
        </p>
      </S>
      <S h="Cómo borrarlo">
        <p>Cerrando sesión o limpiando los datos del sitio desde la configuración de tu navegador.</p>
      </S>
    </Doc>
  );
}

export function JuegoResponsable() {
  return (
    <Doc title="Juego responsable">
      <S h="Apostar es entretenimiento">
        <p>Nunca apuestes dinero que necesitas para tus gastos. No intentes recuperar pérdidas apostando más.</p>
      </S>
      <S h="Señales de alerta">
        <ul>
          <li>Apuestas más tiempo o dinero del que planeabas.</li>
          <li>Piensas en apostar todo el tiempo o mientes sobre ello.</li>
          <li>Pides prestado para apostar.</li>
        </ul>
      </S>
      <S h="Herramientas">
        <p>
          Define límites de depósito y de apuesta desde <Link to="/perfil" className="text-gold underline">tu perfil</Link>. Si necesitas una pausa o
          autoexclusión, <Link to="/contacto" className="text-gold underline">contáctanos</Link>.
        </p>
      </S>
      <S h="Ayuda profesional">
        <p>Línea 106 (salud mental, Colombia). Solo para mayores de 18 años.</p>
      </S>
    </Doc>
  );
}

// Función (no constante de módulo): LIMITS se rellena desde la API antes del primer render.
const getFaq = () => [
  ['¿Cómo recargo saldo?', 'Ve a Billetera → Recargar, elige el monto y paga con tarjeta, Nequi o PSE a través de Wompi. El saldo se acredita al aprobarse el pago.'],
  ['¿Cuál es el monto mínimo para apostar?', `${formatCurrency(LIMITS.minStake)} por apuesta. Para recargar, ${formatCurrency(LIMITS.minDeposit)}.`],
  ['¿Qué es una apuesta combinada?', 'Reúne varias selecciones en un solo boleto: las cuotas se multiplican y debes acertar todas para ganar.'],
  ['¿Puedo cancelar una apuesta?', 'Sí, mientras esté activa y ninguno de sus partidos haya comenzado. Desde Mis apuestas → Cancelar.'],
  ['Mi pago quedó pendiente, ¿qué hago?', 'Algunos medios tardan unos minutos. Revisa el estado en la pantalla de resultado o en tus movimientos; si pasa más de una hora, contáctanos con tu referencia.'],
  ['Olvidé mi contraseña', 'Usa "¿Olvidaste tu contraseña?" en el inicio de sesión: te enviaremos un código de 6 dígitos al correo.'],
];

export function Ayuda() {
  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title="Ayuda y preguntas frecuentes" description="Respuestas rápidas a las dudas más comunes." />
      <div className="space-y-3">
        {getFaq().map(([q, a]) => (
          <details key={q} className="card-surface group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text-primary">
              {q}
              <span aria-hidden="true" className="text-gold transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-text-secondary">
        ¿No encuentras lo que buscas? <Link to="/contacto" className="font-semibold text-gold">Escríbenos</Link>.
      </p>
    </div>
  );
}

export function Contacto() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!isRequired(form.name)) next.name = 'Ingresa tu nombre.';
    if (!isValidEmail(form.email)) next.email = 'Ingresa un correo válido.';
    if (form.name.trim().length > 100) next.name = 'Máximo 100 caracteres.';
    if (form.subject.trim().length < 3) next.subject = 'El asunto debe tener al menos 3 caracteres.';
    else if (form.subject.trim().length > 150) next.subject = 'Máximo 150 caracteres.';
    if (form.message.trim().length < 10) next.message = 'Cuéntanos un poco más (mínimo 10 caracteres).';
    else if (form.message.trim().length > 2000) next.message = 'Máximo 2000 caracteres.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await contactService.send({ name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim(), message: form.message.trim() });
      setSent(true);
      showToast('Mensaje enviado. Te responderemos pronto.', 'success');
    } catch (err) {
      // 422 (validación), 429 (demasiados intentos) y 503 (no se pudo guardar/enviar) traen su mensaje en español.
      setSubmitError((err as { message?: string })?.message ?? 'No pudimos enviar tu mensaje. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title="Contacto" description="Escríbenos y te respondemos en menos de 24 horas." />
      <div className="card-surface p-5 sm:p-7">
        {sent ? (
          <div role="status" className="text-center">
            <h2 className="text-lg font-bold text-text-primary">¡Gracias por escribirnos!</h2>
            <p className="mt-2 text-sm text-text-secondary">Revisaremos tu mensaje y te responderemos al correo indicado.</p>
            <Link to="/" className="btn-primary mt-5">Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField label="Nombre" htmlFor="c-name" error={errors.name} required>
              <Input id="c-name" value={form.name} onChange={set('name')} error={!!errors.name} />
            </FormField>
            <FormField label="Correo electrónico" htmlFor="c-email" error={errors.email} required>
              <Input id="c-email" type="email" value={form.email} onChange={set('email')} error={!!errors.email} />
            </FormField>
            <FormField label="Asunto" htmlFor="c-subject" error={errors.subject} required>
              <Input id="c-subject" maxLength={150} value={form.subject} onChange={set('subject')} error={!!errors.subject} />
            </FormField>
            <FormField label="Mensaje" htmlFor="c-msg" error={errors.message} required>
              <textarea id="c-msg" rows={5} value={form.message} onChange={set('message')} className={`input-base ${errors.message ? 'input-error' : ''}`} />
            </FormField>
            {submitError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{submitError}</p>}
            <Button type="submit" fullWidth loading={loading}>Enviar mensaje</Button>
          </form>
        )}
      </div>
    </div>
  );
}
