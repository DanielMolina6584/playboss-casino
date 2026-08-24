import type { Match } from '@/types';
import { OddsButton } from '@/components/match/OddsButton';
import { useBetSlip } from '@/hooks/useBetSlip';

export function MatchCard({ match }: { match: Match }) {
  const { selections, addSelection } = useBetSlip();
  const market = match.markets[0];
  const currentSelectionId = selections.find((s) => s.matchId === match.id)?.id;

  function handleOddClick(selectionLabel: string, oddId: string, value: number) {
    addSelection({
      id: oddId,
      matchId: match.id,
      matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      marketName: market.name,
      selectionLabel,
      odd: value,
    });
  }

  return (
    <div className="card-surface animate-fade-in p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-text-secondary">
        <span>{match.league.name}</span>
        <span>{match.time}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="h-11 w-11 object-contain" />
          <span className="text-sm font-medium leading-tight text-text-primary">{match.homeTeam.name}</span>
        </div>

        <span className="shrink-0 px-2 text-xs font-semibold text-text-secondary">VS</span>

        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="h-11 w-11 object-contain" />
          <span className="text-sm font-medium leading-tight text-text-primary">{match.awayTeam.name}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {market.odds.map((odd) => {
          const selectionLabel =
            odd.selection === '1' ? match.homeTeam.name : odd.selection === '2' ? match.awayTeam.name : 'Empate';
          return (
            <OddsButton
              key={odd.id}
              odd={odd}
              isSelected={currentSelectionId === odd.id}
              onClick={() => handleOddClick(selectionLabel, odd.id, odd.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
