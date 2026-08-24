import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';

/**
 * Rutas públicas exclusivas para invitados (login, registro, recuperación).
 * Si el usuario ya está autenticado, lo redirige fuera de estas pantallas.
 */
export function PublicOnlyRoute() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
