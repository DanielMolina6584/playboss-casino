import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/useToast';
import type { ToastType } from '@/context/ToastContext';

const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  info: 'border-gold/40 bg-gold/10 text-gold',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-fade-in flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-card backdrop-blur-sm ${toastStyles[toast.type]}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Cerrar notificación"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
