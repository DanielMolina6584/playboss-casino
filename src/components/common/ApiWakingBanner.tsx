import { useApiWaking } from '@/utils/wakeApi';

/** Aviso discreto mientras el servidor (plan gratuito) se despierta; desaparece solo. */
export function ApiWakingBanner() {
  if (!useApiWaking()) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 border-t border-gold/30 bg-bg-primary/95 px-4 py-2 text-center text-xs text-text-secondary backdrop-blur"
    >
      <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" aria-hidden="true" />
      Conectando con el servidor… la primera carga puede tardar hasta 30 segundos.
    </div>
  );
}
