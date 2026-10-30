import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MockBanner } from '@/components/layout/MockBanner';
import { BetSlipMobileDrawer } from '@/components/betslip/BetSlipDrawer';
import { PlaceBetModals } from '@/components/betslip/PlaceBetModals';
import { ToastContainer } from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';

export function AppLayout() {
  const { pathname, hash } = useLocation();
  const { showToast } = useToast();

  // Al cambiar de página se vuelve arriba (salvo anclas internas como /#pagos).
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  // Sesión expirada (401 de la API): el AuthContext limpia al usuario y las
  // rutas protegidas redirigen a /login; aquí solo se avisa.
  useEffect(() => {
    const onExpired = () => showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'error');
    window.addEventListener('playboss:session-expired', onExpired);
    return () => window.removeEventListener('playboss:session-expired', onExpired);
  }, [showToast]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-bg-primary"
      >
        Saltar al contenido
      </a>
      <MockBanner />
      <Navbar />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BetSlipMobileDrawer />
      <PlaceBetModals />
      <ToastContainer />
    </div>
  );
}
