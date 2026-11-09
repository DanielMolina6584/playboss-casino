import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { League, Match } from '@/types';
import { matchesService } from '@/services/matchesService';
import { LeagueTabs } from '@/components/match/LeagueTabs';
import { MatchCard } from '@/components/match/MatchCard';
import { MatchCardSkeleton } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/EmptyState';
import { BetSlipDesktopPanel } from '@/components/betslip/BetSlipDrawer';
import { SectionHeader } from '@/components/home/SectionHeader';
import { FEATURE_FLAGS } from '@/config/features';

const MAX_MATCHES = 6;

function MatchesTeaser() {
  return (
    <div className="card-surface relative isolate overflow-hidden p-6 sm:p-10">
      <img
        src="/assets/illustrations/ball.svg"
        alt=""
        className="absolute -right-10 -top-10 -z-10 h-56 w-56 opacity-20"
        loading="lazy"
      />
      <h3 className="text-lg font-bold text-text-primary">Las cuotas llegan muy pronto</h3>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
        Estamos conectando los partidos y cuotas en vivo. Crea tu cuenta ahora y serás de los primeros en apostar.
      </p>
      <Link to="/registro" className="btn-primary mt-5">
        Crear mi cuenta <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export function FeaturedMatches() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(FEATURE_FLAGS.matches);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const leaguesData = await matchesService.getLeagues();
      setLeagues(leaguesData);
      const initialLeague = leaguesData[0]?.id ?? null;
      setActiveLeagueId(initialLeague);
      setMatches(await matchesService.getMatches({ leagueId: initialLeague ?? undefined }));
    } catch {
      setError('No fue posible cargar los próximos partidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!FEATURE_FLAGS.matches) return;
    loadData();
  }, []);

  async function handleLeagueChange(leagueId: string | null) {
    setActiveLeagueId(leagueId);
    setLoading(true);
    try {
      setMatches(await matchesService.getMatches({ leagueId: leagueId ?? undefined }));
    } catch {
      setError('No fue posible cargar los próximos partidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="matches-title" className="container-page mt-12 sm:mt-16">
      <SectionHeader
        id="matches-title"
        eyebrow="Destacados"
        title="Próximos partidos"
        description="Elige tu cuota favorita y arma tu cupón."
        action={
          FEATURE_FLAGS.matches ? (
            <Link to="/apuestas" className="text-sm font-semibold text-gold hover:text-gold-secondary">
              Ver todos <span aria-hidden="true">→</span>
            </Link>
          ) : undefined
        }
      />

      {!FEATURE_FLAGS.matches ? (
        <MatchesTeaser />
      ) : (
        <div className="flex gap-5">
          <div className="min-w-0 flex-1">
            <LeagueTabs leagues={leagues} activeLeagueId={activeLeagueId} onChange={handleLeagueChange} />
            <div className="mt-4">
              {error ? (
                <ErrorMessage message={error} onRetry={loadData} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)
                    : matches.slice(0, MAX_MATCHES).map((match) => <MatchCard key={match.id} match={match} />)}
                </div>
              )}
            </div>
          </div>
          <BetSlipDesktopPanel />
        </div>
      )}
    </section>
  );
}
