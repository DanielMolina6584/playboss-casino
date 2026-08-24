// ==========================================================================
// PlayBoss — Modelos / Interfaces de dominio
// ==========================================================================

export interface User {
  id: string;
  fullName: string;
  email: string;
  documentId: string;
  birthDate: string; // ISO date
  createdAt: string;
  role: 'user' | 'admin';
}

export interface League {
  id: string;
  name: string;
  country: string;
  logo: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'suspended';

export type MarketType = '1X2';

export interface Odd {
  id: string;
  market: MarketType;
  selection: '1' | 'X' | '2';
  label: string;
  value: number;
}

export interface Market {
  id: string;
  type: MarketType;
  name: string;
  odds: Odd[];
}

export interface Match {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  date: string; // ISO date
  time: string; // display time
  status: MatchStatus;
  markets: Market[];
}

// ---------------------------------------------------------------------------
// Betting slip / cupón de apuestas
// ---------------------------------------------------------------------------

export interface BetSelection {
  id: string; // unique id = matchId + marketId + oddId
  matchId: string;
  matchLabel: string; // "Barcelona vs Real Madrid"
  marketName: string; // "Ganador del partido"
  selectionLabel: string; // "Barcelona"
  odd: number;
}

export interface BetSlip {
  selections: BetSelection[];
  stake: number;
  potentialWin: number;
  totalOdds: number;
}

export type BetStatus = 'pending' | 'won' | 'lost' | 'cashed_out';

export interface Bet {
  id: string;
  userId: string;
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: BetStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Auth / API
// ---------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  documentId: string;
  birthDate: string;
  password: string;
  passwordConfirmation: string;
  acceptsTerms: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
