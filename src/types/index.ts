// ==========================================================================
// PlayBoss — Modelos / Interfaces de dominio (camelCase en el front).
// Los servicios mapean desde/hacia el contrato de la API (ver docs/CONTRATOS-API.md).
// ==========================================================================

export interface User {
  id: string;
  fullName: string;
  email: string;
  documentId: string;
  birthDate: string; // ISO date
  createdAt: string;
  role: 'user' | 'admin';
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  /** Id de la foto de perfil en Google Drive (se descarga con GET /perfil/foto). */
  photoId?: string;
}

export interface Sport {
  id: string;
  name: string;
}

export interface League {
  id: string;
  /** Texto estable para URLs (?liga=laliga). */
  slug: string;
  name: string;
  country: string;
  logo?: string;
  driveFileId?: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  driveFileId?: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'suspended';

/** Código de mercado, p. ej. "1X2". */
export type MarketType = string;

export interface Odd {
  id: string;
  market: MarketType;
  /** Código de la selección tal cual lo envía la API ("1", "X", "2"). */
  selection: string;
  label: string;
  value: number;
}

export interface Market {
  /** Id del mercado (documento Mongo en la API). */
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
  date: string; // ISO datetime
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  markets: Market[];
}

export interface MatchFilters {
  leagueId?: string;
  /** YYYY-MM-DD (inclusive). */
  from?: string;
  to?: string;
  q?: string;
}

// ---------------------------------------------------------------------------
// Cupón de apuestas
// ---------------------------------------------------------------------------

export interface BetSelection {
  id: string; // id de la cuota (odd.id)
  matchId: string;
  marketId: string;
  selectionCode: string;
  matchLabel: string; // "Barcelona vs Real Madrid"
  marketName: string; // "Ganador del partido"
  selectionLabel: string; // "Barcelona"
  odd: number;
  matchDate?: string;
}

/** single: una apuesta por selección · combo: una sola apuesta con cuotas multiplicadas. */
export type BetMode = 'single' | 'combo';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';
export type SelectionResult = 'pending' | 'won' | 'lost' | 'void';

export interface BetLeg extends BetSelection {
  result: SelectionResult;
}

export interface Bet {
  id: string;
  /** Código corto legible (#PB-000123). */
  code: string;
  userId: string;
  type: 'single' | 'combo';
  selections: BetLeg[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: BetStatus;
  createdAt: string;
  settledAt?: string | null;
  /** true si aún puede cancelarse (pendiente y sin partidos iniciados). */
  cancellable: boolean;
}

export interface PlaceBetParams {
  selections: BetSelection[];
  stake: number;
  mode: BetMode;
  idempotencyKey: string;
}

// ---------------------------------------------------------------------------
// Cuenta / movimientos / pagos
// ---------------------------------------------------------------------------

export interface Account {
  availableBalance: number;
  heldBalance: number;
  currency: string;
}

export type AccountMovementType =
  | 'deposit'
  | 'withdrawal'
  | 'bet_reserved'
  | 'bet_released'
  | 'bet_lost'
  | 'winnings';

export interface AccountMovement {
  id: string;
  type: AccountMovementType;
  amount: number;
  availableBalanceAfter: number;
  heldBalanceAfter: number;
  betId?: string | null;
  description: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface MovementFilters {
  type?: AccountMovementType | '';
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'error';

export type PaymentMethodCode = 'WOMPI_CARD' | 'NEQUI' | 'PSE';

export interface WompiCheckout {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  redirectUrl?: string | null;
  /** URL final de la pasarela (Wompi Web Checkout o simulador interno en modo mock). */
  checkoutUrl: string;
}

export interface PaymentTransaction {
  reference: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  confirmedAt?: string | null;
  checkout?: WompiCheckout;
  /** true si la transacción es simulada (no pasó por Wompi). */
  simulated?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  bankAccount: string;
  status: 'requested';
  createdAt: string;
  simulated: true;
}

export interface ResponsibleLimits {
  dailyDeposit: number | null;
  weeklyDeposit: number | null;
  dailyStake: number | null;
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
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  documentType: string;
  documentId: string;
  email: string;
  birthDate: string;
  password: string;
  passwordConfirmation: string;
  acceptsTerms: boolean;
  /** Foto de perfil obligatoria; la API la guarda en Google Drive. */
  photo: File | null;
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

export interface ChangePasswordPayload {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  /** La API no está accesible (sin red / no desplegada): habilita el fallback a mock. */
  unavailable?: boolean;
}
