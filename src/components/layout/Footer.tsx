import { Link } from 'react-router-dom';

const platformLinks = [
  { to: '/apuestas', label: 'Apuestas' },
  { to: '/mis-apuestas', label: 'Mis apuestas' },
  { to: '/billetera', label: 'Billetera' },
  { to: '/#bono', label: 'Promociones' },
  { to: '/#pagos', label: 'Métodos de pago' },
];

const legalLinks = [
  { to: '/legal/terminos', label: 'Términos y condiciones' },
  { to: '/legal/privacidad', label: 'Política de privacidad' },
  { to: '/legal/cookies', label: 'Política de cookies' },
  { to: '/legal/juego-responsable', label: 'Juego responsable' },
  { to: '/ayuda', label: 'Ayuda y preguntas frecuentes' },
  { to: '/contacto', label: 'Contacto' },
];

const payments = ['Mercado Pago', 'PSE', 'Tarjetas'];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-secondary">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <img src="/assets/logo.png" alt="PlayBoss" className="h-9 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
            Apuesta en tus partidos favoritos, disfruta la emoción y demuestra quién manda.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="rounded-md bg-gold px-2 py-1 text-xs font-black text-bg-primary">+18</span>
            <span className="text-xs text-text-secondary">Solo para mayores de edad</span>
          </div>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Plataforma</h2>
          <ul className="space-y-2 text-sm text-text-secondary">
            {platformLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-gold">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Legal</h2>
          <ul className="space-y-2 text-sm text-text-secondary">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-gold">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Pagos aceptados</h2>
          <ul className="flex flex-wrap gap-2">
            {payments.map((p) => (
              <li key={p} className="rounded-lg border border-white/10 bg-bg-primary px-3 py-1.5 text-xs font-bold text-gold">
                {p}
              </li>
            ))}
          </ul>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-text-primary">Juego responsable</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Apostar debe ser una actividad de entretenimiento. Juega con límites.
          </p>
        </div>
      </div>

      <div className="border-t border-border-subtle py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-center text-xs text-text-secondary sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} PlayBoss. Todos los derechos reservados.</p>
          <p>Las apuestas pueden causar adicción. Juega con responsabilidad.</p>
        </div>
      </div>
    </footer>
  );
}
