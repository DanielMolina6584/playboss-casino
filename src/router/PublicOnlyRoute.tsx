import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';

/**
 * Rutas públicas exclusivas para invitados (login, registro, recuperación).
 * Si el usuario ya está autenticado, lo redirige fuera de estas pantallas.
 */
export function PublicOnlyRoute() {
  const { authenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (authenticated && user?.profileComplete === false) {
    return <Navigate to="/completar-perfil" replace />;
  }

  if (authenticated) {
    const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  }

  return <Outlet />;
}
