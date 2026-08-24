import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-base">
        {label}
        {required && <span className="ml-0.5 text-gold">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}
