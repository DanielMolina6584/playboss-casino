export function formatCurrency(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatOdd(value: number): string {
  return value.toFixed(2);
}

export function calculateTotalOdds(odds: number[]): number {
  if (odds.length === 0) return 0;
  return odds.reduce((acc, odd) => acc * odd, 1);
}

export function calculatePotentialWin(stake: number, totalOdds: number): number {
  if (!stake || !totalOdds) return 0;
  return Number((stake * totalOdds).toFixed(2));
}

export function maskDocumentId(documentId: string): string {
  if (documentId.length <= 4) return documentId;
  return `${'*'.repeat(documentId.length - 4)}${documentId.slice(-4)}`;
}

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
const weekdayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'long' });

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "Hoy · 3:00 p. m.", "Mañana · …", "sábado · …" o "12 nov · …". */
export function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
  const time = timeFmt.format(d);
  if (days === 0) return `Hoy · ${time}`;
  if (days === 1) return `Mañana · ${time}`;
  if (days > 1 && days < 7) {
    const w = weekdayFmt.format(d);
    return `${w.charAt(0).toUpperCase()}${w.slice(1)} · ${time}`;
  }
  return `${new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(d)} · ${time}`;
}

/** Fecha local YYYY-MM-DD (para inputs type=date y query params). */
export function toInputDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Convierte lo que escribe el usuario ("$ 10.000", "10000") a número entero. */
export function parseAmount(input: string): number {
  const digits = input.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

/** Formato con separador de miles es-CO sin símbolo, para inputs. */
export function formatAmountInput(value: number): string {
  return value ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value) : '';
}
