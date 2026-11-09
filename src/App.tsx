import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BetSlipProvider } from '@/context/BetSlipContext';
import { ToastProvider } from '@/context/ToastContext';
import { WalletProvider } from '@/context/WalletContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PublicOnlyRoute } from '@/router/PublicOnlyRoute';
import { AdminRoute } from '@/router/AdminRoute';

import { Home } from '@/pages/Home';
import { Apuestas } from '@/pages/Apuestas';
import { PartidoDetalle } from '@/pages/PartidoDetalle';
import { MisApuestas } from '@/pages/MisApuestas';
import { BetDetalle } from '@/pages/BetDetalle';
import { Perfil } from '@/pages/Perfil';
import { AdminDashboard } from '@/pages/Admin';
import { NotFound } from '@/pages/NotFound';
import { Billetera } from '@/pages/wallet/Billetera';
import { Recarga } from '@/pages/wallet/Recarga';
import { RecargaSimulador } from '@/pages/wallet/RecargaSimulador';
import { RecargaResultado } from '@/pages/wallet/RecargaResultado';
import { Retiro } from '@/pages/wallet/Retiro';
import { Ayuda, Contacto, Cookies, JuegoResponsable, Privacidad, Terminos } from '@/pages/legal/StaticPages';
import { Login } from '@/pages/auth/Login';
import { Registro } from '@/pages/auth/Registro';
import { Recuperar } from '@/pages/auth/Recuperar';
import { RecuperarCodigo } from '@/pages/auth/RecuperarCodigo';
import { RecuperarNuevaContrasena } from '@/pages/auth/RecuperarNuevaContrasena';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <WalletProvider>
            <BetSlipProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  {/* Rutas públicas */}
                  <Route path="/" element={<Home />} />
                  <Route path="/apuestas" element={<Apuestas />} />
                  <Route path="/partidos/:id" element={<PartidoDetalle />} />
                  <Route path="/legal/terminos" element={<Terminos />} />
                  <Route path="/legal/privacidad" element={<Privacidad />} />
                  <Route path="/legal/cookies" element={<Cookies />} />
                  <Route path="/legal/juego-responsable" element={<JuegoResponsable />} />
                  <Route path="/ayuda" element={<Ayuda />} />
                  <Route path="/contacto" element={<Contacto />} />

                  {/* Rutas solo para invitados */}
                  <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/recuperar" element={<Recuperar />} />
                    <Route path="/recuperar/codigo" element={<RecuperarCodigo />} />
                    <Route path="/recuperar/nueva-contrasena" element={<RecuperarNuevaContrasena />} />
                  </Route>

                  {/* Rutas privadas (requieren sesión) */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/mis-apuestas" element={<MisApuestas />} />
                    <Route path="/mis-apuestas/:id" element={<BetDetalle />} />
                    <Route path="/billetera" element={<Billetera />} />
                    <Route path="/billetera/recarga" element={<Recarga />} />
                    <Route path="/billetera/recarga/simulador" element={<RecargaSimulador />} />
                    <Route path="/billetera/recarga/resultado" element={<RecargaResultado />} />
                    <Route path="/billetera/retiro" element={<Retiro />} />
                    <Route path="/perfil" element={<Perfil />} />
                  </Route>

                  {/* Rutas de administración (requieren rol admin) */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BetSlipProvider>
          </WalletProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
