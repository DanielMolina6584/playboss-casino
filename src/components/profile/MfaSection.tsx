import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import type { MfaSetup, MfaStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { mfaService } from '@/services/mfaService';
import { isMockActive } from '@/services/dataSource';
import { Button } from '@/components/common/Button';
import { CodeInput } from '@/components/common/CodeInput';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/EmptyState';
import { QrCode } from '@/components/common/QrCode';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { GOOGLE_BUTTON_AVAILABLE } from '@/config/auth';
import { formatDateTime } from '@/utils/formatters';

const errMsg = (e: unknown, fallback: string) => (e as { message?: string })?.message ?? fallback;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadCodes(codes: string[]) {
  const body = `PlayBoss - códigos de recuperación de la verificación en dos pasos\nGenerados: ${new Date().toLocaleString('es-CO')}\nCada código sirve una sola vez. Guárdalos en un lugar seguro.\n\n${codes.join('\n')}\n`;
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'playboss-codigos-recuperacion.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/** Los 10 códigos de recuperación: se muestran una sola vez. */
function RecoveryCodes({ codes, onDone, doneLabel }: { codes: string[]; onDone: () => void; doneLabel: string }) {
  const { showToast } = useToast();
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-4" data-testid="recovery-codes">
      <div role="alert" className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
        <strong>Guárdalos ahora.</strong> Son la única forma de entrar si pierdes tu teléfono, cada uno sirve una sola vez y no volverán a mostrarse.
      </div>
      <ul className="grid grid-cols-2 gap-2 rounded-lg bg-bg-secondary p-3 font-mono text-sm tracking-wider text-text-primary">
        {codes.map((c) => (
          <li key={c} className="text-center">{c}</li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          onClick={async () => showToast((await copyText(codes.join('\n'))) ? 'Códigos copiados.' : 'No se pudo copiar; usa Descargar.', 'info')}
        >
          Copiar
        </Button>
        <Button variant="secondary" onClick={() => downloadCodes(codes)}>Descargar .txt</Button>
      </div>
      <label className="flex items-start gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold" />
        Ya guardé mis códigos de recuperación en un lugar seguro.
      </label>
      <Button fullWidth disabled={!saved} onClick={onDone}>{doneLabel}</Button>
    </div>
  );
}

function groupKey(secret: string) {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

/** Paso a paso: QR + clave manual -> confirmar con el primer código -> códigos de recuperación. */
function SetupFlow({ onFinished, onCancel }: { onFinished: () => void; onCancel: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    mfaService
      .setup()
      .then((s) => alive && setSetup(s))
      .catch((e) => alive && setError(errMsg(e, 'No fue posible iniciar la configuración.')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!setup || !user || !isMockActive()) return;
    let alive = true;
    const refresh = () => mfaService.mockCurrentCode(user.id).then((c) => alive && setDemoCode(c));
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [setup, user]);

  async function confirm(code: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setCodes(await mfaService.activate(code));
    } catch (e) {
      setError(errMsg(e, 'Código incorrecto.'));
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (codes) return <RecoveryCodes codes={codes} onDone={onFinished} doneLabel="Listo, terminar" />;
  if (loading) return <div className="flex justify-center py-8"><Loading /></div>;
  if (!setup) return <ErrorMessage message={error ?? 'No fue posible iniciar la configuración.'} onRetry={onCancel} />;

  return (
    <div className="space-y-5">
      <ol className="space-y-5 text-sm text-text-secondary">
        <li>
          <p><strong className="text-text-primary">1.</strong> Instala una app autenticadora (Google Authenticator, Authy, Microsoft Authenticator…) y escanea este código QR.</p>
          <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <QrCode value={setup.otpauthUri} size={176} label="Código QR para tu app autenticadora" />
            <div className="min-w-0 flex-1 space-y-2">
              <p>¿No puedes escanearlo? Ingresa esta clave a mano (tipo: basada en tiempo):</p>
              <p className="break-all rounded-lg bg-bg-secondary px-3 py-2 font-mono text-sm tracking-wider text-text-primary" data-testid="mfa-secret">{groupKey(setup.secret)}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={async () => showToast((await copyText(setup.secret)) ? 'Clave copiada.' : 'No se pudo copiar.', 'info')}>
                  Copiar clave
                </Button>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-gold">Ver enlace otpauth://</summary>
                <p className="mt-1 break-all font-mono text-text-secondary">{setup.otpauthUri}</p>
              </details>
            </div>
          </div>
        </li>
        <li>
          <p className="mb-3"><strong className="text-text-primary">2.</strong> Ingresa el código de 6 dígitos que muestra la app para confirmar.</p>
          <CodeInput resetKey={resetKey} error={!!error} onComplete={confirm} />
          {busy && <p className="mt-2 text-center text-sm">Verificando…</p>}
          {error && <p role="alert" className="mt-3 text-center text-sm text-red-400">{error}</p>}
          {isMockActive() && demoCode && <p className="mt-3 text-center text-xs text-gold">Modo demostración: el código vigente es {demoCode}.</p>}
        </li>
      </ol>
      <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
    </div>
  );
}

/** Pide un código (de la app o de recuperación) y, opcionalmente, la contraseña / reautenticación Google. */
function ConfirmModal(props: {
  title: string;
  description: string;
  submitLabel: string;
  needsReauth: boolean;
  hasPassword: boolean;
  onClose: () => void;
  onSubmit: (v: { code: string; password?: string; googleCredential?: string }) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [google, setGoogle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (props.needsReauth && props.hasPassword && !password) return setError('Ingresa tu contraseña.');
    if (props.needsReauth && !props.hasPassword && !google) return setError('Confirma tu identidad con Google.');
    if (!code.trim()) return setError('Ingresa un código de tu app o un código de recuperación.');
    setBusy(true);
    setError(null);
    try {
      await props.onSubmit({ code, password: password || undefined, googleCredential: google ?? undefined });
    } catch (err) {
      setError(errMsg(err, 'No fue posible completar la operación.'));
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onClose={busy ? () => undefined : props.onClose} title={props.title}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-text-secondary">{props.description}</p>
        {props.needsReauth && props.hasPassword && (
          <div>
            <label htmlFor="mfa-pass" className="label-base">Contraseña actual</label>
            <PasswordInput id="mfa-pass" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        {props.needsReauth && !props.hasPassword && (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Tu cuenta no tiene contraseña: confirma tu identidad con Google.</p>
            {google ? (
              <p className="text-sm text-emerald-400">Identidad confirmada con Google.</p>
            ) : GOOGLE_BUTTON_AVAILABLE ? (
              <GoogleSignInButton onCredential={setGoogle} disabled={busy} />
            ) : (
              <p className="text-sm text-red-300">El inicio con Google no está disponible en este entorno.</p>
            )}
          </div>
        )}
        <div>
          <label htmlFor="mfa-code" className="label-base">Código de 6 dígitos o de recuperación</label>
          <Input id="mfa-code" autoComplete="one-time-code" autoFocus inputMode="text" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={props.onClose} disabled={busy}>Cancelar</Button>
          <Button type="submit" loading={busy}>{props.submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

/** Perfil > Seguridad: estado del 2FA y su activación, desactivación y códigos de recuperación. */
export function MfaSection() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const { state } = useLocation();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable' | 'regen'>('idle');
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await mfaService.getStatus();
      setStatus(s);
    } catch (e) {
      setError(errMsg(e, 'No fue posible cargar el estado de la verificación en dos pasos.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function sync(active: boolean) {
    if (user) updateUser({ ...user, mfaActive: active });
    return load();
  }

  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!status) return <div className="flex justify-center py-8"><Loading /></div>;
  if (!status.enabled) return <p className="text-sm text-text-secondary">La verificación en dos pasos no está habilitada en este servidor.</p>;

  const forced = (state as { mfaRequired?: boolean } | null)?.mfaRequired || (status.required && !status.active);
  const lowCodes = status.active && status.recoveryRemaining <= 3;

  return (
    <div className="space-y-4">
      {forced && !status.active && (
        <div role="alert" className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          <strong>Tu rol exige la verificación en dos pasos.</strong> Actívala para usar el panel de administración y solicitar retiros.
        </div>
      )}

      {mode === 'setup' ? (
        <SetupFlow
          onCancel={() => { setMode('idle'); load(); }}
          onFinished={async () => {
            setMode('idle');
            await sync(true);
            showToast('Verificación en dos pasos activada.', 'success');
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                Verificación en dos pasos (app autenticadora)
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-bg-secondary text-text-secondary'}`}
                  data-testid="mfa-badge"
                >
                  {status.active ? 'Activa' : 'Desactivada'}
                </span>
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {status.active
                  ? `Activa desde ${status.confirmedAt ? formatDateTime(status.confirmedAt) : '—'}. Te pediremos un código al iniciar sesión y al solicitar retiros.`
                  : 'Agrega una capa extra de seguridad: además de tu contraseña, pediremos un código de 6 dígitos de tu teléfono.'}
              </p>
            </div>
            {!status.active && <Button onClick={() => setMode('setup')}>Activar</Button>}
          </div>

          {status.active && (
            <div className="rounded-lg border border-border-subtle p-4">
              <p className="text-sm text-text-primary">
                Códigos de recuperación disponibles: <strong data-testid="mfa-recovery-left">{status.recoveryRemaining}</strong> de 10
              </p>
              {lowCodes && <p className="mt-1 text-sm text-gold">Te quedan pocos códigos: genera nuevos y guárdalos.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setMode('regen')}>Regenerar códigos</Button>
                {status.required ? (
                  <p className="self-center text-xs text-text-secondary">Tu rol exige 2FA: no se puede desactivar.</p>
                ) : (
                  <Button variant="ghost" onClick={() => setMode('disable')}>Desactivar</Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'disable' && (
        <ConfirmModal
          title="Desactivar verificación en dos pasos"
          description="Por seguridad confirma tu identidad y un código vigente. Tu cuenta quedará protegida solo por tu contraseña."
          submitLabel="Desactivar"
          needsReauth
          hasPassword={status.hasPassword}
          onClose={() => setMode('idle')}
          onSubmit={async (v) => {
            await mfaService.disable({ code: v.code, password: v.password, googleCredential: v.googleCredential });
            setMode('idle');
            await sync(false);
            showToast('Verificación en dos pasos desactivada.', 'info');
          }}
        />
      )}

      {mode === 'regen' && (
        <ConfirmModal
          title="Regenerar códigos de recuperación"
          description="Los códigos actuales dejarán de funcionar. Ingresa un código vigente para generar 10 nuevos."
          submitLabel="Generar"
          needsReauth={false}
          hasPassword={status.hasPassword}
          onClose={() => setMode('idle')}
          onSubmit={async (v) => {
            setNewCodes(await mfaService.regenerateRecoveryCodes(v.code));
            setMode('idle');
            await load();
          }}
        />
      )}

      <Modal isOpen={!!newCodes} onClose={() => undefined} title="Tus nuevos códigos de recuperación">
        {newCodes && <RecoveryCodes codes={newCodes} onDone={() => setNewCodes(null)} doneLabel="Cerrar" />}
      </Modal>
    </div>
  );
}
