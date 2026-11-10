import { useState } from 'react';

interface TeamBadgeProps {
  name: string;
  logo?: string;
  size?: 'xs' | 'sm' | 'md';
}

/** Escudo del equipo; si no hay imagen (o falla), muestra las iniciales. */
export function TeamBadge({ name, logo, size = 'md' }: TeamBadgeProps) {
  const [failed, setFailed] = useState(false);
  const dim = size === 'md' ? 'h-11 w-11 text-sm' : size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-4 w-4 text-[7px]';
  const initials = name
    .split(' ')
    .filter((w) => w.length > 2 || name.split(' ').length === 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (logo && !failed) {
    return <img src={logo} alt="" className={`${dim.split(' ').slice(0, 2).join(' ')} object-contain`} onError={() => setFailed(true)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${dim} flex items-center justify-center rounded-full bg-gold/10 font-bold text-gold ring-1 ring-gold/30`}
    >
      {initials || '?'}
    </span>
  );
}
