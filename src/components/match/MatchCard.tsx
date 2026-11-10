import { Link } from 'react-router-dom';
import type { Match, Odd } from '@/types';
import { OddsButton } from '@/components/match/OddsButton';
import { TeamBadge } from '@/components/common/TeamBadge';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useToast } from '@/hooks/useToast';
import { formatMatchDate } from '@/utils/formatters';
import { LIMITS } from '@/config/limits';

function selectionLabel(match: Match, odd: Odd): string {
  if (odd.market !== '1X2') return odd.label;
  return odd.selection === '1' ? match.homeTeam.name : odd.selection === '2' ? match.awayTeam.name : 'Empate';
}

export function MatchCard({ match }: { match: Match }) {
  const { toggleSelection, hasSelection } = useBetSlip();
  const { showToast } = useToast();
  const market = match.markets[0];
  const bettable = match.status === 'scheduled' && !!market && new Date(match.date).getTime() > Date.now();
  const label = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

  function handleOddClick(odd: Odd) {
    const result = toggleSelection({
      id: odd.id,
      matchId: match.id,
      marketId: market.id,
      selectionCode: odd.selection,
      matchLabel: label,
      marketName: market.name,
      selectionLabel: selectionLabel(match, odd),
      odd: odd.value,
      matchDate: match.date,
      homeName: match.homeTeam.name,
      awayName: match.awayTeam.name,
      homeLogo: match.homeTeam.logo,
      awayLogo: match.awayTeam.logo,
      leagueName: match.league.name,
    });
    if (result === 'max') showToast(`Tu cupón admite máximo ${LIMITS.maxSelections} selecciones.`, 'error');
    if (result === 'replaced') showToast('Reemplazamos tu selección anterior de este partido.', 'info');
  }

  return (
    <article className="card-surface animate-fade-in p-4" aria-label={label}>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-text-primary">
          <TeamBadge name={match.league.name} logo={match.league.logo} size="xs" />
          <span className="truncate">{match.league.name}</span>
        </span>
        {match.status === 'live' ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 font-bold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> EN VIVO
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-medium text-gold">
            {formatMatchDate(match.date)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge name={match.homeTeam.name} logo={match.homeTeam.logo} />
          <span className="text-sm font-medium leading-tight text-text-primary">{match.homeTeam.name}</span>
        </div>
        <span className="shrink-0 px-2 text-xs font-semibold text-text-secondary">VS</span>
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamBadge name={match.awayTeam.name} logo={match.awayTeam.logo} />
          <span className="text-sm font-medium leading-tight text-text-primary">{match.awayTeam.name}</span>
        </div>
      </div>

      {market ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {market.odds.map((odd) => (
            <OddsButton
              key={odd.id}
              odd={odd}
              disabled={!bettable}
              isSelected={hasSelection(odd.id)}
              ariaLabel={`${selectionLabel(match, odd)}, cuota ${odd.value.toFixed(2)}`}
              onClick={() => handleOddClick(odd)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-center text-xs text-text-secondary">
          Cuotas no disponibles por ahora.
        </p>
      )}
      {market && !bettable && (
        <p className="mt-2 text-center text-xs text-text-secondary">Apuestas cerradas para este partido.</p>
      )}
      {match.markets.length > 1 && (
        <Link
          to={`/partidos/${match.id}`}
          className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border-subtle py-2 text-xs font-semibold text-gold transition-colors hover:border-gold/40 hover:bg-gold/5"
        >
          Ver {match.markets.length - 1} mercados más: goles, córners, tarjetas, tiros… <span aria-hidden="true">→</span>
        </Link>
      )}
    </article>
  );
}
