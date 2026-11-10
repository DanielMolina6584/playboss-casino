import { useMemo } from 'react';
import { generateQr } from '@/utils/qr';

interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
}

/** Código QR en SVG (módulos oscuros sobre fondo blanco para que cualquier lector lo escanee, también en tema oscuro). */
export function QrCode({ value, size = 192, label = 'Código QR' }: QrCodeProps) {
  const matrix = useMemo(() => {
    try {
      return generateQr(value, 'M');
    } catch {
      return null;
    }
  }, [value]);
  if (!matrix) return null;

  const border = 4;
  const dim = matrix.length + border * 2;
  const path = matrix
    .flatMap((row, y) => row.map((dark, x) => (dark ? `M${x + border},${y + border}h1v1h-1z` : '')))
    .join('');
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${dim} ${dim}`} shapeRendering="crispEdges" className="rounded-lg bg-white">
      <rect width={dim} height={dim} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
