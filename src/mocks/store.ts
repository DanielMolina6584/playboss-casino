import type {
  Account,
  AccountMovement,
  AccountMovementType,
  Bet,
  BetLeg,
  PaymentStatus,
  PaymentTransaction,
  LimitKey,
  User,
  UserStatus,
  WithdrawalRequest,
} from '@/types';

// ---------------------------------------------------------------------------
// Base de datos simulada persistida en localStorage. Es la fuente de verdad de
// todos los servicios cuando se usa modo mock, de forma que usuarios, saldo,
// movimientos, apuestas y pagos sean coherentes entre sí.
// ---------------------------------------------------------------------------

const KEY = 'playboss_mock_db_v2';
const DAY = 86_400_000;

export interface MockUserRecord {
  user: User;
  password: string;
  status: UserStatus;
}

export interface MockLimitsRecord {
  limits: Record<LimitKey, number | null>;
  exclusionUntil: string | null;
}

export interface MockWithdrawal extends WithdrawalRequest {
  userId: string;
  key?: string;
}

export interface MockPayment extends PaymentTransaction {
  userId: string;
  outcome?: PaymentStatus;
  credited?: boolean;
  key?: string;
}

interface MockDb {
  seq: number;
  users: MockUserRecord[];
  accounts: Record<string, Account>;
  movements: Record<string, AccountMovement[]>;
  bets: Record<string, Bet[]>;
  payments: Record<string, MockPayment>;
  recovery: Record<string, string>;
  limits: Record<string, MockLimitsRecord>;
  withdrawals: MockWithdrawal[];
  /** 2FA simulado por usuario (opcional: bases guardadas antes de existir esta función no lo traen). */
  mfa?: Record<string, MockMfa>;
}

export interface MockMfa {
  secret: string;
  confirmedAt: string | null;
  lastCounter: number | null;
  recovery: { code: string; used: boolean }[];
  /** Marcas de tiempo (ms) de los fallos recientes, para el bloqueo de 5 intentos / 5 min. */
  failures: number[];
}

export const DEMO_USER = { email: 'demo@playboss.co', password: 'Demo1234!' };
export const DEMO_ADMIN = { email: 'admin@playboss.co', password: 'Admin1234!' };
export const MOCK_RECOVERY_CODE = '123456';

let cache: MockDb | null = null;

export function getDb(): MockDb {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as MockDb;
      return cache;
    }
  } catch {
    /* almacenamiento corrupto o no disponible: se re-siembra */
  }
  cache = seed();
  saveDb();
  return cache;
}

export function saveDb(): void {
  try {
    if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* sin almacenamiento: el estado vive solo en memoria */
  }
}

export function resetMockDb(): void {
  cache = seed();
  saveDb();
}

export function nextId(db: MockDb = getDb()): number {
  db.seq += 1;
  return db.seq;
}

export function betCode(id: string | number): string {
  return `PB-${String(id).padStart(6, '0')}`;
}

export function findUserByEmail(email: string): MockUserRecord | undefined {
  return getDb().users.find((u) => u.user.email.toLowerCase() === email.trim().toLowerCase());
}

export function getAccount(userId: string): Account {
  const db = getDb();
  if (!db.accounts[userId]) db.accounts[userId] = { availableBalance: 0, heldBalance: 0, currency: 'COP' };
  return db.accounts[userId];
}

/** Aplica un movimiento: ajusta saldos y registra la línea del libro. */
export function postMovement(
  userId: string,
  type: AccountMovementType,
  amount: number,
  deltas: { available?: number; held?: number },
  description: string,
  extra: { betId?: string; at?: string } = {},
): AccountMovement {
  const db = getDb();
  const acc = getAccount(userId);
  acc.availableBalance += deltas.available ?? 0;
  acc.heldBalance += deltas.held ?? 0;
  const mov: AccountMovement = {
    id: String(nextId(db)),
    type,
    amount,
    availableBalanceAfter: acc.availableBalance,
    heldBalanceAfter: acc.heldBalance,
    betId: extra.betId ?? null,
    description,
    createdAt: extra.at ?? new Date().toISOString(),
  };
  (db.movements[userId] ??= []).unshift(mov);
  saveDb();
  return mov;
}

// ---------------------------------------------------------------------------
// Semilla
// ---------------------------------------------------------------------------

function mkUser(
  id: string,
  first: string,
  last: string,
  email: string,
  doc: string,
  role: User['role'],
  status: UserStatus = 'ACT',
): MockUserRecord {
  return {
    status,
    password: role === 'admin' ? DEMO_ADMIN.password : DEMO_USER.password,
    user: {
      id,
      fullName: `${first} ${last}`,
      firstName: first,
      lastName: last,
      email,
      documentId: doc,
      documentType: 'CC',
      birthDate: '1992-04-12',
      createdAt: new Date(Date.now() - 60 * DAY).toISOString(),
      role,
      phone: '3001234567',
    },
  };
}

function seed(): MockDb {
  const db: MockDb = {
    seq: 1000,
    users: [
      mkUser('900001', 'Camila', 'Rojas', DEMO_USER.email, '1012345678', 'user'),
      mkUser('900000', 'Admin', 'PlayBoss', DEMO_ADMIN.email, '79000111', 'admin'),
      mkUser('900002', 'Andrés', 'Pérez', 'andres.perez@example.com', '1098765432', 'user'),
      mkUser('900003', 'Laura', 'Gómez', 'laura.gomez@example.com', '52112233', 'user', 'BLQ'),
      mkUser('900004', 'Mateo', 'Díaz', 'mateo.diaz@example.com', '1020304050', 'user', 'SUS'),
    ],
    accounts: {},
    movements: {},
    bets: {},
    payments: {},
    recovery: {},
    limits: {},
    withdrawals: [],
  };
  cache = db;
  const uid = '900001';
  const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

  const leg = (
    matchId: string,
    matchLabel: string,
    selectionLabel: string,
    code: string,
    odd: number,
    result: BetLeg['result'],
    daysAgo: number,
  ): BetLeg => ({
    id: `${matchId}-${code}`,
    matchId,
    marketId: `${matchId}-1x2`,
    selectionCode: code,
    matchLabel,
    marketName: 'Ganador del partido',
    selectionLabel,
    odd,
    matchDate: ago(daysAgo),
    result,
  });

  function addBet(
    legs: BetLeg[],
    stake: number,
    status: Bet['status'],
    daysAgo: number,
    cancellable = false,
  ): Bet {
    const id = String(nextId(db));
    const totalOdds = Number(legs.reduce((a, l) => a * l.odd, 1).toFixed(2));
    const bet: Bet = {
      id,
      code: betCode(id),
      userId: uid,
      type: legs.length === 1 ? 'single' : 'combo',
      selections: legs,
      stake,
      totalOdds,
      potentialWin: Math.round(stake * totalOdds),
      status,
      createdAt: ago(daysAgo),
      settledAt: status === 'pending' ? null : ago(daysAgo - 0.1),
      cancellable,
    };
    (db.bets[uid] ??= []).unshift(bet);
    postMovement(uid, 'bet_reserved', stake, { available: -stake, held: stake }, `Apuesta ${bet.code}`, {
      betId: id,
      at: bet.createdAt,
    });
    if (status === 'won') {
      postMovement(uid, 'winnings', bet.potentialWin, { available: bet.potentialWin, held: -stake }, `Premio apuesta ${bet.code}`, {
        betId: id,
        at: bet.settledAt!,
      });
    } else if (status === 'lost') {
      postMovement(uid, 'bet_lost', stake, { held: -stake }, `Apuesta perdida ${bet.code}`, { betId: id, at: bet.settledAt! });
    } else if (status === 'void') {
      postMovement(uid, 'bet_released', stake, { available: stake, held: -stake }, `Apuesta anulada ${bet.code}`, {
        betId: id,
        at: bet.settledAt!,
      });
    }
    return bet;
  }

  postMovement(uid, 'deposit', 300_000, { available: 300_000 }, 'Depósito confirmado por Wompi', { at: ago(20) });
  addBet([leg('h1', 'Inter vs Milan', 'Inter', '1', 2.1, 'won', 15)], 20_000, 'won', 15.2);
  addBet([leg('h2', 'Junior vs Nacional', 'Empate', 'X', 3.2, 'lost', 10)], 10_000, 'lost', 10.2);
  addBet(
    [
      leg('h3', 'Chelsea vs Arsenal', 'Chelsea', '1', 2.4, 'won', 8),
      leg('h4', 'Sevilla vs Valencia', 'Valencia', '2', 2.9, 'lost', 8),
    ],
    15_000,
    'lost',
    8.2,
  );
  addBet([leg('h5', 'Liverpool vs Everton', 'Liverpool', '1', 2.05, 'won', 6)], 10_000, 'won', 6.2);
  addBet([leg('h6', 'Boca vs River', 'Boca', '1', 2.6, 'void', 5)], 5_000, 'void', 5.2);
  postMovement(uid, 'deposit', 50_000, { available: 50_000 }, 'Depósito confirmado por Wompi', { at: ago(3) });
  const future = (matchId: string, label: string, sel: string, code: string, odd: number, hours: number): BetLeg => ({
    ...leg(matchId, label, sel, code, odd, 'pending', 0),
    matchDate: new Date(Date.now() + hours * 3_600_000).toISOString(),
  });
  addBet(
    [
      future('m1', 'Barcelona vs Real Madrid', 'Barcelona', '1', 1.85, 3),
      future('m7', 'Atlético Nacional vs Millonarios', 'Atlético Nacional', '1', 2.1, 4),
    ],
    20_000,
    'pending',
    0.05,
    true,
  );

  // Retiros de ejemplo (uno por estado) con sus movimientos contables.
  const wd = (
    userId: string,
    amount: number,
    status: WithdrawalRequest['status'],
    daysAgo: number,
    extra: Partial<MockWithdrawal> = {},
  ): MockWithdrawal => {
    const w: MockWithdrawal = {
      id: String(nextId(db)),
      userId,
      amount,
      currency: 'COP',
      status,
      bank: 'Bancolombia',
      accountType: 'AHORROS',
      accountNumber: '12345677890',
      holder: userId === uid ? 'Camila Rojas' : 'Andrés Pérez',
      holderDocument: userId === uid ? '1012345678' : '1098765432',
      rejectionReason: null,
      requestedAt: ago(daysAgo),
      resolvedAt: status === 'pending' ? null : ago(daysAgo - 0.1),
      ...extra,
    };
    db.withdrawals.unshift(w);
    postMovement(userId, 'withdrawal_reserved', amount, { available: -amount, held: amount }, `Retiro #${w.id} solicitado`, { at: w.requestedAt });
    if (status === 'paid') {
      postMovement(userId, 'withdrawal_paid', amount, { held: -amount }, `Retiro #${w.id} pagado`, { at: w.resolvedAt! });
    } else if (status === 'rejected') {
      postMovement(userId, 'withdrawal_released', amount, { available: amount, held: -amount }, `Retiro #${w.id} rechazado`, {
        at: w.resolvedAt!,
      });
    }
    return w;
  };
  wd(uid, 50_000, 'paid', 2.5);
  wd(uid, 30_000, 'rejected', 1.5, { rejectionReason: 'Datos bancarios inválidos: el número de cuenta no existe.' });
  wd(uid, 40_000, 'pending', 0.02, { bank: 'Nequi', accountType: 'NEQUI', accountNumber: '3001234567' });
  postMovement('900002', 'deposit', 200_000, { available: 200_000 }, 'Depósito confirmado por Wompi', { at: ago(4) });
  wd('900002', 80_000, 'pending', 0.3, { bank: 'Davivienda', accountType: 'CORRIENTE', accountNumber: '4455667788' });
  saveDb();
  return db;
}
