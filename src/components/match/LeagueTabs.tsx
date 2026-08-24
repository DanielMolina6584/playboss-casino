import type { League } from '@/types';

interface LeagueTabsProps {
  leagues: League[];
  activeLeagueId: string | null;
  onChange: (leagueId: string | null) => void;
}

export function LeagueTabs({ leagues, activeLeagueId, onChange }: LeagueTabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ligas disponibles">
      {leagues.map((league) => {
        const isActive = league.id === activeLeagueId;
        return (
          <button
            key={league.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(league.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gold text-bg-primary'
                : 'border border-border-subtle bg-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {league.name}
          </button>
        );
      })}
    </div>
  );
}
