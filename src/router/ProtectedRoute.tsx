import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';

/**
 * Bloquea el acceso a rutas privadas si el usuario no está autenticado.
 * Redirige a /login conservando la ruta de origen para volver tras iniciar sesión.
 */
export function ProtectedRoute() {
  const { authenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Usuario creado con Google sin fecha de nacimiento/documento: debe completarlos primero.
  if (user?.profileComplete === false && location.pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace />;
  }

  return <Outlet />;
}
