import { useBetSlip } from '@/hooks/useBetSlip';
import { BetSlip } from '@/components/betslip/BetSlip';

export function BetSlipDesktopPanel() {
  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-[340px] shrink-0 xl:block">
      <div className="card-surface flex h-full flex-col p-4">
        <BetSlip />
      </div>
    </aside>
  );
}

export function BetSlipMobileDrawer() {
  const { selections, isOpen, closeSlip, toggleSlip } = useBetSlip();

  return (
    <>
      {selections.length > 0 && (
        <button
          onClick={toggleSlip}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gold px-5 py-3.5 font-semibold text-bg-primary shadow-gold transition-transform duration-200 active:scale-95 xl:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Cupón ({selections.length})
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={closeSlip} aria-hidden="true" />
          <div className="animate-slide-up absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-border-subtle bg-card p-4 pb-8">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="max-h-[75vh] overflow-y-auto">
              <BetSlip onClose={closeSlip} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
