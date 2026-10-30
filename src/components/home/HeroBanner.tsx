import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const highlights = ['Depósitos con PSE y Nequi', 'Retiros ágiles', 'Solo mayores de 18'];

export function HeroBanner() {
  const { authenticated } = useAuth();

  return (
    <section aria-labelledby="home-hero-title" className="container-page pt-4 sm:pt-6">
      <div className="relative isolate overflow-hidden rounded-2xl border border-gold/20 bg-bg-secondary shadow-2xl shadow-black/40">
        <img
          src="/assets/banners/hero-main.svg"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-right"
        />
        <div
          className="absolute inset-0 -z-10 bg-bg-primary/55 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-bg-primary/20 sm:bg-transparent sm:via-bg-primary/60 sm:to-bg-primary/10"
          aria-hidden="true"
        />

        <div className="flex min-h-[420px] flex-col justify-center px-5 py-10 sm:min-h-[460px] sm:px-10 lg:min-h-[500px] lg:px-14">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-black/50 px-3 py-1 text-xs font-semibold text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            Bono de bienvenida 100% hasta $200.000
          </span>

          <h1
            id="home-hero-title"
            className="max-w-xl text-4xl font-black uppercase leading-[1.02] tracking-tight text-text-primary sm:text-5xl lg:text-6xl"
          >
            Tu juego,
            <br />
            <span className="bg-gradient-to-r from-[#FFF0A8] via-gold to-gold-secondary bg-clip-text text-transparent">
              tus reglas
            </span>
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
            Apuesta en tus partidos favoritos, con cuotas claras y la emoción del deporte a tu manera.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {authenticated ? (
              <Link to="/apuestas" className="btn-primary px-7 py-3.5 text-base shadow-gold">
                Ir a apuestas <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <>
                <Link to="/registro" className="btn-primary px-7 py-3.5 text-base shadow-gold">
                  Crear mi cuenta <span aria-hidden="true">→</span>
                </Link>
                <Link to="/apuestas" className="btn-secondary bg-black/40 px-7 py-3.5 text-base backdrop-blur">
                  Ver apuestas
                </Link>
              </>
            )}
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC400" strokeWidth="3" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
