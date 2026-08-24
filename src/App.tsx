import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BetSlipProvider } from '@/context/BetSlipContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PublicOnlyRoute } from '@/router/PublicOnlyRoute';
import { AdminRoute } from '@/router/AdminRoute';

import { Home } from '@/pages/Home';
import { Apuestas } from '@/pages/Apuestas';
import { MisApuestas } from '@/pages/MisApuestas';
import { Perfil } from '@/pages/Perfil';
import { AdminDashboard } from '@/pages/Admin';
import { NotFound } from '@/pages/NotFound';
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
          <BetSlipProvider>
            <Routes>
              <Route element={<AppLayout />}>
                {/* Rutas públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/apuestas" element={<Apuestas />} />

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
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
