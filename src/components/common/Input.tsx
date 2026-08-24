import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leadingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, leadingIcon, className = '', ...rest }, ref) => {
    if (leadingIcon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {leadingIcon}
          </span>
          <input
            ref={ref}
            className={`input-base pl-10 ${error ? 'input-error' : ''} ${className}`}
            {...rest}
          />
        </div>
      );
    }
    return <input ref={ref} className={`input-base ${error ? 'input-error' : ''} ${className}`} {...rest} />;
  },
);

Input.displayName = 'Input';
