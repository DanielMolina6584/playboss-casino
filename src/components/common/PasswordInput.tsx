import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { getPasswordStrength } from '@/utils/validators';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  showStrength?: boolean;
}

const strengthConfig = {
  weak: { label: 'Débil', color: 'bg-red-500', width: 'w-1/3' },
  medium: { label: 'Media', color: 'bg-gold-secondary', width: 'w-2/3' },
  strong: { label: 'Fuerte', color: 'bg-emerald-500', width: 'w-full' },
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, showStrength = false, className = '', value, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const strength = showStrength && typeof value === 'string' && value.length > 0 ? getPasswordStrength(value) : null;

    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            className={`input-base pr-11 ${error ? 'input-error' : ''} ${className}`}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {strength && (
          <div className="mt-2">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`${strengthConfig[strength].color} ${strengthConfig[strength].width} rounded-full transition-all duration-250`}
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Seguridad: <span className="font-medium text-text-primary">{strengthConfig[strength].label}</span>
            </p>
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
