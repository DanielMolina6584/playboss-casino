export function formatCurrency(value: number, currency = 'USD'): string {
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
