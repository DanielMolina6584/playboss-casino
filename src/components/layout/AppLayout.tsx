import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BetSlipMobileDrawer } from '@/components/betslip/BetSlipDrawer';
import { ToastContainer } from '@/components/common/Toast';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BetSlipMobileDrawer />
      <ToastContainer />
    </div>
  );
}
