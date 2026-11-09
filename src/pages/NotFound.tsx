import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container-page relative isolate flex min-h-[65vh] flex-col items-center justify-center overflow-hidden text-center">
      <img src="/assets/illustrations/ball.svg" alt="" aria-hidden="true" className="absolute -z-10 h-80 w-80 opacity-10" />
      <span className="bg-gradient-to-b from-gold to-gold-secondary bg-clip-text text-8xl font-black text-transparent">404</span>
      <h1 className="mt-2 text-2xl font-bold text-text-primary">Fuera de juego</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">La página que buscas no existe o fue movida. Vuelve a la cancha.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Ir al inicio</Link>
        <Link to="/apuestas" className="btn-secondary">Ver partidos</Link>
      </div>
    </div>
  );
}
