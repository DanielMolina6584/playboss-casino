import { Link } from 'react-router-dom';

const tips = [
  'Apuesta solo el dinero que puedas permitirte perder.',
  'Define límites de tiempo y de gasto antes de jugar.',
  'Nunca persigas pérdidas ni apuestes bajo presión.',
  'Si sientes que pierdes el control, pide ayuda y haz una pausa.',
];

export function ResponsibleGaming() {
  return (
    <section
      id="juego-responsable"
      aria-labelledby="rg-title"
      className="container-page mb-12 mt-12 sm:mb-16 sm:mt-16"
    >
      <div className="relative isolate overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-card to-bg-primary p-6 sm:p-10">
        <img
          src="/assets/banners/promo-responsable.svg"
          alt=""
          className="absolute inset-y-0 right-0 -z-10 hidden h-full w-1/2 object-cover object-right opacity-60 md:block"
          loading="lazy"
        />
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-md bg-gold px-2.5 py-1 text-sm font-black text-bg-primary">
            +18
          </span>
          <h2 id="rg-title" className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Juega con responsabilidad
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Las apuestas son solo para mayores de 18 años y deben ser una forma de entretenimiento, no una fuente de ingresos.
          </p>
          <ul className="mt-5 space-y-2.5">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm text-white/85">
                <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC400" strokeWidth="3" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
          <Link to="/legal/juego-responsable" className="btn-secondary mt-6">
            Conocer más sobre juego responsable
          </Link>
        </div>
      </div>
    </section>
  );
}
