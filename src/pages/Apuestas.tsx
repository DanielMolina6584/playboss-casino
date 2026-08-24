import { useEffect, useState } from 'react';
import type { League, Match } from '@/types';
import { matchesService } from '@/services/matchesService';
import { LeagueTabs } from '@/components/match/LeagueTabs';
import { MatchCard } from '@/components/match/MatchCard';
import { MatchCardSkeleton } from '@/components/common/Loading';
import { ErrorMessage, EmptyState } from '@/components/common/EmptyState';
import { BetSlipDesktopPanel } from '@/components/betslip/BetSlipDrawer';

export function Apuestas() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(leagueId?: string | null) {
    setLoading(true);
    setError(null);
    try {
      if (!leagues.length) {
        const leaguesData = await matchesService.getLeagues();
        setLeagues(leaguesData);
      }
      const matchesData = await matchesService.getUpcomingMatches(leagueId ?? undefined);
      setMatches(matchesData);
    } catch {
      setError('No fue posible cargar los partidos disponibles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLeagueChange(leagueId: string | null) {
    setActiveLeagueId(leagueId);
    loadData(leagueId);
  }

  return (
    <div className="container-page flex gap-6 py-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Apuestas</h1>
        <p className="mt-1 text-sm text-text-secondary">Explora los próximos partidos y arma tu cupón.</p>

        <div className="mt-6 mb-5 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => handleLeagueChange(null)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              activeLeagueId === null
                ? 'bg-gold text-bg-primary'
                : 'border border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            Todas
          </button>
          <LeagueTabs leagues={leagues} activeLeagueId={activeLeagueId} onChange={handleLeagueChange} />
        </div>

        {error && <ErrorMessage message={error} onRetry={() => loadData(activeLeagueId)} />}

        {!error && !loading && matches.length === 0 && (
          <EmptyState title="No hay partidos disponibles" description="Vuelve a intentarlo más tarde." />
        )}

        {!error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)
              : matches.map((match) => <MatchCard key={match.id} match={match} />)}
          </div>
        )}
      </div>

      <BetSlipDesktopPanel />
    </div>
  );
}
