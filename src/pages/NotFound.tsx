import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="text-6xl font-black text-gold">404</span>
      <h1 className="mt-3 text-xl font-semibold text-text-primary">Página no encontrada</h1>
      <p className="mt-1 text-sm text-text-secondary">La página que buscas no existe o fue movida.</p>
      <Link to="/" className="btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}
