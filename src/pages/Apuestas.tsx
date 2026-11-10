import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { League, Match } from '@/types';
import { matchesService } from '@/services/matchesService';
import { TeamBadge } from '@/components/common/TeamBadge';
import { MatchCard } from '@/components/match/MatchCard';
import { MatchCardSkeleton } from '@/components/common/Loading';
import { ErrorMessage, EmptyState } from '@/components/common/EmptyState';
import { BetSlipDesktopPanel } from '@/components/betslip/BetSlipDrawer';
import { FEATURE_FLAGS } from '@/config/features';
import { toInputDate } from '@/utils/formatters';

type DateFilter = 'todos' | 'hoy' | 'manana' | 'semana';

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'todos', label: 'Todas las fechas' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'manana', label: 'Mañana' },
  { value: 'semana', label: 'Próximos 7 días' },
];

function dateRange(filter: DateFilter): { from?: string; to?: string } {
  const today = new Date();
  const plus = (days: number) => toInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
  if (filter === 'hoy') return { from: plus(0), to: plus(0) };
  if (filter === 'manana') return { from: plus(1), to: plus(1) };
  if (filter === 'semana') return { from: plus(0), to: plus(7) };
  return {};
}

const chip = (active: boolean) =>
  `shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
    active ? 'bg-gold text-bg-primary' : 'border border-border-subtle text-text-secondary hover:text-text-primary'
  }`;

export function Apuestas() {
  const [params, setParams] = useSearchParams();
  const ligaParam = params.get('liga') ?? '';
  const deporte = params.get('deporte') ?? 'futbol';
  const fecha = (params.get('fecha') as DateFilter) || 'todos';
  const urlQuery = params.get('q') ?? '';

  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesReady, setLeaguesReady] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(urlQuery);
  const [reloadKey, setReloadKey] = useState(0);

  const activeLeague = useMemo(
    () => leagues.find((l) => l.id === ligaParam || l.slug === ligaParam) ?? null,
    [leagues, ligaParam],
  );
  const isFootball = deporte === 'futbol';

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Búsqueda: se refleja en la URL con un pequeño retardo.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() !== urlQuery) setParam('q', search.trim() || null);
    }, 300);
    return () => clearTimeout(t);
  }, [search, urlQuery, setParam]);

  useEffect(() => {
    if (!FEATURE_FLAGS.matches) return;
    matchesService
      .getLeagues()
      .then(setLeagues)
      .catch(() => setLeagues([]))
      .finally(() => setLeaguesReady(true));
  }, []);

  useEffect(() => {
    if (!FEATURE_FLAGS.matches || !isFootball || !leaguesReady) {
      if (!isFootball) setLoading(false);
      return;
    }
    // Si piden una liga que no existe, se muestra vacío en vez de "todas".
    if (ligaParam && !activeLeague) {
      setMatches([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    matchesService
      .getMatches({ leagueId: activeLeague?.id, ...dateRange(fecha), q: urlQuery })
      .then((data) => !cancelled && setMatches(data))
      .catch(() => !cancelled && setError('No fue posible cargar los partidos disponibles.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [leaguesReady, isFootball, activeLeague, ligaParam, fecha, urlQuery, reloadKey]);

  const groups = useMemo(() => {
    const map = new Map<string, { league: League; items: Match[] }>();
    matches.forEach((m) => {
      const g = map.get(m.league.id) ?? { league: m.league, items: [] };
      g.items.push(m);
      map.set(m.league.id, g);
    });
    return [...map.values()];
  }, [matches]);

  const hasFilters = !!(ligaParam || urlQuery || fecha !== 'todos');
  function clearFilters() {
    setSearch('');
    setParams(deporte !== 'futbol' ? { deporte } : {}, { replace: true });
  }

  return (
    <div className="container-page flex gap-6 py-8">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Apuestas</h1>
        <p className="mt-1 text-sm text-text-secondary">Explora los próximos partidos y arma tu cupón.</p>

        {!FEATURE_FLAGS.matches ? (
          <div className="mt-6">
            <EmptyState
              title="Muy pronto"
              description="Estamos preparando los partidos y cuotas en vivo. Vuelve pronto para armar tu primer cupón."
            />
          </div>
        ) : !isFootball ? (
          <div className="mt-6">
            <EmptyState
              title="Este deporte llega muy pronto"
              description="Por ahora puedes apostar en fútbol: Liga BetPlay, LaLiga y Premier League."
              action={
                <button className="btn-primary" onClick={() => setParams({}, { replace: true })}>
                  Ver fútbol
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  aria-label="Buscar equipo o liga"
                  placeholder="Buscar equipo o liga"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-10"
                />
              </div>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por liga">
                <button onClick={() => setParam('liga', null)} aria-pressed={!ligaParam} className={chip(!ligaParam)}>
                  Todas las ligas
                </button>
                {leagues.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setParam('liga', l.slug)}
                    aria-pressed={activeLeague?.id === l.id}
                    className={chip(activeLeague?.id === l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por fecha">
                {DATE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setParam('fecha', o.value === 'todos' ? null : o.value)}
                    aria-pressed={fecha === o.value}
                    className={`${chip(fecha === o.value)} !px-3 !py-1.5 !text-xs`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6" aria-live="polite">
              {error && <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

              {!error && loading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <MatchCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {!error && !loading && matches.length === 0 && (
                <EmptyState
                  title="No hay partidos con estos filtros"
                  description="Prueba con otra liga, otra fecha o quita la búsqueda."
                  action={
                    hasFilters ? (
                      <button className="btn-secondary" onClick={clearFilters}>
                        Limpiar filtros
                      </button>
                    ) : undefined
                  }
                />
              )}

              {!error && !loading && groups.length > 0 && (
                <div className="space-y-8">
                  {groups.map(({ league, items }) => (
                    <section key={league.id} aria-labelledby={`liga-${league.id}`}>
                      <h2 id={`liga-${league.id}`} className="mb-3 flex items-center gap-2 text-base font-bold text-text-primary">
                        <TeamBadge name={league.name} logo={league.logo} size="sm" />
                        {league.name}
                        <span className="text-xs font-medium text-text-secondary">
                          {league.country && `${league.country} · `}
                          {items.length} {items.length === 1 ? 'partido' : 'partidos'}
                        </span>
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {items.map((match) => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BetSlipDesktopPanel />
    </div>
  );
}
