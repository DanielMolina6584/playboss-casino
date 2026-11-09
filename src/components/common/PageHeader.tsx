import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backTo?: { to: string; label: string };
}

export function PageHeader({ title, description, action, backTo }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backTo && (
        <Link to={backTo.to} className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-gold">
          <span aria-hidden="true">←</span> {backTo.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
