import { Link } from 'react-router-dom';

const legalLinks = [
  { to: '/legal/terminos', label: 'Términos y condiciones' },
  { to: '/legal/privacidad', label: 'Política de privacidad' },
  { to: '/legal/cookies', label: 'Política de cookies' },
  { to: '/legal/juego-responsable', label: 'Juego responsable' },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-secondary">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <img src="/assets/logo.png" alt="PlayBoss" className="h-9 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Apuesta en tus partidos favoritos, disfruta la emoción y demuestra quién manda.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Plataforma</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><Link to="/apuestas" className="hover:text-gold">Apuestas</Link></li>
            <li><Link to="/mis-apuestas" className="hover:text-gold">Mis apuestas</Link></li>
            <li><Link to="/promociones" className="hover:text-gold">Promociones</Link></li>
            <li><Link to="/ayuda" className="hover:text-gold">Ayuda</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Legal</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Juego responsable</h4>
          <p className="text-sm leading-relaxed text-text-secondary">
            Apostar debe ser una actividad de entretenimiento. Restricción de edad y jurisdicción
            configurable según el país de operación.
          </p>
        </div>
      </div>

      <div className="border-t border-border-subtle py-5">
        <p className="container-page text-center text-xs text-text-secondary">
          © {new Date().getFullYear()} PlayBoss. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
