import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Market, Match, Odd } from '@/types';
import { matchesService } from '@/services/matchesService';
import { OddsButton } from '@/components/match/OddsButton';
import { TeamBadge } from '@/components/common/TeamBadge';
import { Tabs } from '@/components/common/Tabs';
import { Loading } from '@/components/common/Loading';
import { EmptyState, ErrorMessage } from '@/components/common/EmptyState';
import { BetSlipDesktopPanel } from '@/components/betslip/BetSlipDrawer';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useToast } from '@/hooks/useToast';
import { formatMatchDate } from '@/utils/formatters';
import { LIMITS } from '@/config/limits';

type Grupo = 'todos' | 'principales' | 'goles' | 'descanso' | 'marcador' | 'corners' | 'tarjetas' | 'tiros';

/** Pestañas de mercados, como en las casas de apuestas. */
const GRUPOS: { value: Exclude<Grupo, 'todos'>; label: string; incluye: (code: string) => boolean }[] = [
  { value: 'principales', label: 'Principales', incluye: (c) => ['1X2', 'DC', 'DNB', 'BTTS', 'HCP_M1', 'HCP_P1'].includes(c) },
  { value: 'goles', label: 'Goles', incluye: (c) => /^(HOME_|AWAY_)?OU_/.test(c) || c === 'ODD_EVEN' },
  { value: 'descanso', label: 'Descanso', incluye: (c) => c === 'HT_1X2' || c === 'HTFT' },
  { value: 'marcador', label: 'Marcador exacto y combinados', incluye: (c) => c === 'CS' || c === 'RES_BTTS' },
  { value: 'corners', label: 'Córners', incluye: (c) => c.startsWith('CORNERS_') },
  { value: 'tarjetas', label: 'Tarjetas', incluye: (c) => c.startsWith('CARDS_') },
  { value: 'tiros', label: 'Tiros', incluye: (c) => c.startsWith('SHOTS_') || c.startsWith('SOT_') },
];

function columnas(cantidad: number): string {
  if (cantidad === 2) return 'grid-cols-2';
  if (cantidad === 3) return 'grid-cols-3';
  return 'grid-cols-2 sm:grid-cols-3';
}

export function PartidoDetalle() {
  const { id = '' } = useParams();
  const [match, setMatch] = useState<Match | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupo, setGrupo] = useState<Grupo>('todos');
  const { toggleSelection, hasSelection } = useBetSlip();
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMatch(await matchesService.getMatchById(id));
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'No pudimos cargar el partido.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo(() => {
    const markets = match?.markets ?? [];
    return [
      { value: 'todos' as Grupo, label: `Todos (${markets.length})` },
      ...GRUPOS.filter((g) => markets.some((m) => g.incluye(m.type))).map((g) => ({
        value: g.value as Grupo,
        label: `${g.label} (${markets.filter((m) => g.incluye(m.type)).length})`,
      })),
    ];
  }, [match]);

  const visibles = useMemo(() => {
    const markets = match?.markets ?? [];
    const filtro = GRUPOS.find((g) => g.value === grupo);
    return filtro ? markets.filter((m) => filtro.incluye(m.type)) : markets;
  }, [match, grupo]);

  if (loading) return <Loading label="Cargando partido..." />;

  if (error || !match) {
    return (
      <div className="container-page py-8">
        {error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : (
          <EmptyState
            title="Partido no encontrado"
            action={<Link to="/apuestas" className="btn-secondary">Ver partidos</Link>}
          />
        )}
      </div>
    );
  }

  const bettable = match.status === 'scheduled' && new Date(match.date).getTime() > Date.now();
  const matchLabel = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

  function handleOddClick(market: Market, odd: Odd) {
    if (!match) return;
    const result = toggleSelection({
      id: odd.id,
      matchId: match.id,
      marketId: market.id,
      selectionCode: odd.selection,
      matchLabel,
      marketName: market.name,
      selectionLabel: odd.label,
      odd: odd.value,
      matchDate: match.date,
    });
    if (result === 'max') showToast(`Tu cupón admite máximo ${LIMITS.maxSelections} selecciones.`, 'error');
    if (result === 'replaced') showToast('Reemplazamos tu selección anterior de este partido (una por partido).', 'info');
  }

  return (
    <div className="container-page flex gap-6 py-8">
      <div className="min-w-0 flex-1">
        <Link to="/apuestas" className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-gold">
          <span aria-hidden="true">←</span> Todos los partidos
        </Link>

        <section className="card-surface p-5" aria-label={matchLabel}>
          <p className="text-center text-xs font-semibold text-text-secondary">
            {match.league.name} · {formatMatchDate(match.date)}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <TeamBadge name={match.homeTeam.name} logo={match.homeTeam.logo} />
              <span className="text-sm font-bold text-text-primary sm:text-base">{match.homeTeam.name}</span>
            </div>
            <span className="shrink-0 text-xl font-bold text-gold">
              {match.status === 'finished' ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}` : 'VS'}
            </span>
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <TeamBadge name={match.awayTeam.name} logo={match.awayTeam.logo} />
              <span className="text-sm font-bold text-text-primary sm:text-base">{match.awayTeam.name}</span>
            </div>
          </div>
        </section>

        <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">¿Cómo apostar?</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Toca una cuota para agregarla a tu cupón.</li>
            <li>
              <strong className="text-text-primary">Combinada:</strong> agrega selecciones de varios partidos (máximo{' '}
              {LIMITS.maxSelections}) y en el cupón elige <em>Combinada</em>. Las cuotas se multiplican, pero si una
              selección pierde, pierde toda la apuesta.
            </li>
            <li>Solo puedes tener una selección por partido; si eliges otra, reemplaza la anterior.</li>
          </ul>
        </div>

        {!bettable && (
          <p className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-center text-sm text-text-secondary">
            Apuestas cerradas para este partido.
          </p>
        )}

        {match.markets.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Sin mercados disponibles" description="Este partido no tiene cuotas abiertas en este momento." />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <Tabs tabs={tabs} value={grupo} onChange={setGrupo} label="Tipos de apuesta" />
            </div>
            <div className="mt-4 space-y-3">
              {visibles.map((market) => (
                <section key={market.id} className="card-surface p-4" aria-label={market.name}>
                  <h2 className="mb-3 text-sm font-bold text-text-primary">{market.name}</h2>
                  <div className={`grid gap-2 ${columnas(market.odds.length)}`}>
                    {market.odds.map((odd) => (
                      <OddsButton
                        key={odd.id}
                        odd={odd}
                        disabled={!bettable}
                        isSelected={hasSelection(odd.id)}
                        ariaLabel={`${market.name}: ${odd.label}, cuota ${odd.value.toFixed(2)}`}
                        onClick={() => handleOddClick(market, odd)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <BetSlipDesktopPanel />
    </div>
  );
}
