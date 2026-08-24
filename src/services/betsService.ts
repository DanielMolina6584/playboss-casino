import type { Bet, BetSelection } from '@/types';

const MOCK_DELAY = 700;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = 'playboss_bets';

function readStoredBets(): Bet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Bet[]) : [];
  } catch {
    return [];
  }
}

function writeStoredBets(bets: Bet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
}

// Preparado para: POST /bets, GET /bets/me
export const betsService = {
  async placeBet(params: {
    userId: string;
    selections: BetSelection[];
    stake: number;
    totalOdds: number;
    potentialWin: number;
  }): Promise<Bet> {
    await wait(MOCK_DELAY);
    const bet: Bet = {
      id: `bet_${Date.now()}`,
      userId: params.userId,
      selections: params.selections,
      stake: params.stake,
      totalOdds: params.totalOdds,
      potentialWin: params.potentialWin,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const bets = readStoredBets();
    bets.unshift(bet);
    writeStoredBets(bets);
    return bet;
  },

  async getMyBets(): Promise<Bet[]> {
    await wait(400);
    return readStoredBets();
  },
};
