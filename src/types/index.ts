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
  /** false = usuario creado con Google que aún debe completar fecha de nacimiento y documento. */
  profileComplete?: boolean;
  authProvider?: 'local' | 'google';
  photoUrl?: string;
  /** Código de documento (CC, CE...). */
  documentType?: string;
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
  /** URL pública del logo (logo_url de la API). */
  logo?: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  /** URL pública del escudo (escudo_url de la API). */
  logo?: string;
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
  /** Datos del partido que entrega la API en cada selección de una apuesta. */
  homeName?: string;
  awayName?: string;
  homeLogo?: string;
  awayLogo?: string;
  leagueName?: string;
  matchStatus?: string;
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
  | 'withdrawal_reserved'
  | 'withdrawal_paid'
  | 'withdrawal_released'
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
  /** Epoch/ISO de expiración del checkout (parámetro expiration-time), si la API lo envía. */
  expirationTime?: string | null;
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

export type WithdrawalStatus = 'pending' | 'paid' | 'rejected';
export type BankAccountType = 'AHORROS' | 'CORRIENTE' | 'NEQUI' | 'DAVIPLATA';

export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  bank: string;
  accountType: BankAccountType;
  /** Enmascarado para el cliente (****7890); completo solo en la vista admin. */
  accountNumber: string;
  holder: string;
  /** Solo en la vista admin. */
  holderDocument?: string;
  rejectionReason?: string | null;
  requestedAt: string;
  resolvedAt?: string | null;
  /** Solo vista admin. */
  userId?: string;
}

export interface WithdrawalPayload {
  amount: number;
  bank: string;
  accountType: BankAccountType;
  accountNumber: string;
  holder: string;
  holderDocument: string;
  idempotencyKey: string;
}

export type LimitType = 'deposit' | 'stake';
export type LimitPeriod = 'daily' | 'weekly' | 'monthly';
export type LimitKey = `${LimitType}_${LimitPeriod}`;

export interface LimitUsage {
  limit: number | null;
  used: number;
  available: number | null;
}

export interface ResponsibleLimits {
  limits: Record<LimitKey, number | null>;
  usage: Partial<Record<LimitKey, LimitUsage>>;
  selfExclusion: { active: boolean; until: string | null };
}

export type SelfExclusionDays = 1 | 7 | 30 | 90 | 180 | 365;

/** Límites de negocio publicados por GET /configuracion/limites. */
export interface BusinessLimits {
  currency: string;
  minStake: number;
  maxStake: number;
  maxSelections: number;
  minAge: number;
  dailyStakeCap: number;
  maxBetsPerDay: number;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  maxPendingWithdrawals: number;
}

export type UserStatus = 'ACT' | 'BLQ' | 'SUS';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  documentType: string;
  /** Enmascarado por la API. */
  documentNumber: string;
  registeredAt: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
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
  phone?: string;
  birthDate: string;
  password: string;
  passwordConfirmation: string;
  acceptsTerms: boolean;
  /** Foto de perfil: obligatoria en la API (multipart; jpg, png o webp; máx. 3 MB). */
  photo: File | null;
}

export interface CompleteProfilePayload {
  lastName: string;
  secondLastName?: string;
  documentType: string;
  documentId: string;
  birthDate: string;
  phone?: string;
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
  /** Segundos sugeridos por la API antes de reintentar (429). */
  retryAfter?: number;
  /** La API no está accesible (sin red / no desplegada): habilita el fallback a mock. */
  unavailable?: boolean;
}
