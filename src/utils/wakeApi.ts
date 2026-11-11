import { useSyncExternalStore } from 'react';
import { DATA_MODE } from '@/config/features';

// Render (plan gratuito) duerme la API tras ~15 min sin tráfico y la primera petición tarda ~25 s.
// Al abrir el sitio se la despierta en segundo plano; si tarda, se avisa al usuario.

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const PING_PATH = '/configuracion/limites';
const SLOW_AFTER_MS = 3000;
const KEEP_ALIVE_MS = 8 * 60 * 1000;

let waking = false;
let started = false;
const listeners = new Set<() => void>();

function setWaking(value: boolean) {
  if (waking === value) return;
  waking = value;
  listeners.forEach((l) => l());
}

async function ping(): Promise<void> {
  const slow = window.setTimeout(() => setWaking(true), SLOW_AFTER_MS);
  try {
    await fetch(`${API_BASE_URL}${PING_PATH}`, { mode: 'cors', cache: 'no-store', signal: AbortSignal.timeout(60_000) });
  } catch {
    /* sin API (o caída): la app sigue con su comportamiento normal */
  } finally {
    window.clearTimeout(slow);
    setWaking(false);
  }
}

/** Despierta la API al abrir el sitio y la mantiene despierta mientras la pestaña esté visible. */
export function wakeApi(): void {
  if (started || DATA_MODE === 'mock' || typeof window === 'undefined') return;
  started = true;
  void ping();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void ping();
  }, KEEP_ALIVE_MS);
}

export function useApiWaking(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => waking,
    () => false,
  );
}
