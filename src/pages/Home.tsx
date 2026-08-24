import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { League, Match } from '@/types';
import { matchesService } from '@/services/matchesService';
import { LeagueTabs } from '@/components/match/LeagueTabs';
import { MatchCard } from '@/components/match/MatchCard';
import { MatchCardSkeleton } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/EmptyState';
import { BetSlipDesktopPanel } from '@/components/betslip/BetSlipDrawer';

const benefits = [
  {
    title: 'Apuestas seguras',
    description: 'Tus datos siempre protegidos',
    icon: '/assets/icons/icon-shield.png',
  },
  {
    title: 'Pagos rápidos',
    description: 'Depósitos y retiros ágiles',
    icon: '/assets/icons/icon-clock.png',
  },
  {
    title: 'Bonos exclusivos',
    description: 'Las mejores promociones',
    icon: '/assets/icons/icon-gift.png',
  },
];

export function Home() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const leaguesData = await matchesService.getLeagues();
      setLeagues(leaguesData);
      const initialLeague = leaguesData[0]?.id ?? null;
      setActiveLeagueId(initialLeague);
      const matchesData = await matchesService.getUpcomingMatches(initialLeague ?? undefined);
      setMatches(matchesData);
    } catch {
      setError('No fue posible cargar los próximos partidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLeagueChange(leagueId: string | null) {
    setActiveLeagueId(leagueId);
    setLoading(true);
    try {
      const data = await matchesService.getUpcomingMatches(leagueId ?? undefined);
      setMatches(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex gap-6 py-6">
      <div className="min-w-0 flex-1">
        {/* HERO */}
        <section
          className="relative overflow-hidden rounded-2xl border border-border-subtle"
          style={{
            backgroundImage: "url('/assets/backgrounds/stadium-01.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-transparent" />
          <div className="relative px-6 py-14 sm:px-10 sm:py-20">
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              TU JUEGO.
              <br />
              <span className="text-gold">TUS REGLAS.</span>
            </h1>
            <p className="mt-4 max-w-md text-text-secondary sm:text-lg">
              Apuesta en tus partidos favoritos, disfruta la emoción y demuestra quién manda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/apuestas" className="btn-primary">
                Apostar ahora
              </Link>
              <Link to="/apuestas" className="btn-secondary">
                Ver partidos
              </Link>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="card-surface flex items-center gap-3 p-4">
              <img src={benefit.icon} alt="" className="h-10 w-10 object-contain" />
              <div>
                <p className="font-semibold text-text-primary">{benefit.title}</p>
                <p className="text-sm text-text-secondary">{benefit.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* PROMO BANNER */}
        <section
          className="relative mt-6 overflow-hidden rounded-2xl border border-border-subtle p-6 sm:p-8"
          style={{
            backgroundImage: "url('/assets/hero/hero-05-bono.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-gold">Bono de bienvenida</p>
          <h2 className="mt-1 text-2xl font-black text-text-primary sm:text-3xl">100% hasta $200.000</h2>
          <p className="mt-1 text-sm text-text-secondary">en tu primer depósito</p>
          <Link to="/registro" className="btn-primary mt-4 inline-flex">
            Quiero mi bono
          </Link>
        </section>

        {/* PARTIDOS */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-text-primary">Próximos partidos</h2>
            <LeagueTabs leagues={leagues} activeLeagueId={activeLeagueId} onChange={handleLeagueChange} />
          </div>

          {error && <ErrorMessage message={error} onRetry={loadData} />}

          {!error && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)
                : matches.map((match) => <MatchCard key={match.id} match={match} />)}
            </div>
          )}
        </section>
      </div>

      <BetSlipDesktopPanel />
    </div>
  );
}
