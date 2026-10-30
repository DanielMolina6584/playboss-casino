import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/home/SectionHeader';

const iconProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const BasketIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3v18M5.5 5.5c3 3 3 10 0 13M18.5 5.5c-3 3-3 10 0 13" />
  </svg>
);
const TennisIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M4 7c5 2 5 8 0 10M20 7c-5 2-5 8 0 10" />
  </svg>
);

interface Shortcut {
  label: string;
  hint: string;
  media: ReactNode;
  to: string;
}

const logo = (src: string) => <img src={src} alt="" className="h-9 w-9 object-contain" loading="lazy" />;

const shortcuts: Shortcut[] = [
  { label: 'Liga BetPlay', hint: 'Colombia', media: logo('/assets/illustrations/trophy.svg'), to: '/apuestas?liga=liga-betplay' },
  { label: 'LaLiga', hint: 'España', media: logo('/assets/logos/laliga/real_madrid.png'), to: '/apuestas?liga=laliga' },
  { label: 'Premier League', hint: 'Inglaterra', media: logo('/assets/logos/epl/liverpool.png'), to: '/apuestas?liga=premier-league' },
  { label: 'Fútbol', hint: 'Todas las ligas', media: logo('/assets/illustrations/ball.svg'), to: '/apuestas?deporte=futbol' },
  { label: 'Baloncesto', hint: 'NBA y más', media: BasketIcon, to: '/apuestas?deporte=baloncesto' },
  { label: 'Tenis', hint: 'ATP y WTA', media: TennisIcon, to: '/apuestas?deporte=tenis' },
];

export function LeagueShortcuts() {
  return (
    <section aria-labelledby="shortcuts-title" className="container-page mt-12 sm:mt-16">
      <SectionHeader id="shortcuts-title" eyebrow="Explora" title="Ligas y deportes" />
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {shortcuts.map((s) => (
          <li key={s.label} className="w-36 shrink-0 snap-start sm:w-auto">
            <Link
              to={s.to}
              className="card-surface group flex h-full flex-col items-center gap-3 p-4 text-center hover:border-gold/40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gold ring-1 ring-white/10 transition-all group-hover:bg-gold/10 group-hover:ring-gold/40">
                {s.media}
              </span>
              <span>
                <span className="block text-sm font-semibold text-text-primary">{s.label}</span>
                <span className="mt-0.5 block text-xs text-text-secondary">{s.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
