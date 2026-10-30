import type { ReactNode } from 'react';

interface SectionHeaderProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ id, eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
        )}
        <h2 id={id} className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
