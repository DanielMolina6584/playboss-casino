import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';

/**
 * Protege las rutas del panel administrativo: exige sesión activa
 * y rol "admin". Cualquier otro caso se redirige.
 */
export function AdminRoute() {
  const { authenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Un admin sin 2FA no puede usar el panel: se le lleva a activarlo (la API responde 403 mfa_requerido).
  if (user.mfaRequired && !user.mfaActive) {
    return <Navigate to="/perfil#seguridad" replace state={{ mfaRequired: true }} />;
  }

  return <Outlet />;
}
