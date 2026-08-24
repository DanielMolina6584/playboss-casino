import type { League, Match } from '@/types';
import { leagues, matches } from '@/mocks/data';

const MOCK_DELAY = 500;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Preparado para: GET /leagues, GET /matches?league=&status=
export const matchesService = {
  async getLeagues(): Promise<League[]> {
    await wait(MOCK_DELAY);
    return leagues;
  },

  async getUpcomingMatches(leagueId?: string): Promise<Match[]> {
    await wait(MOCK_DELAY);
    if (!leagueId) return matches;
    return matches.filter((m) => m.league.id === leagueId);
  },

  async getMatchById(matchId: string): Promise<Match | undefined> {
    await wait(300);
    return matches.find((m) => m.id === matchId);
  },
};
