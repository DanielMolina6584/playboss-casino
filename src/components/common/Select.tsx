import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', children, ...rest }, ref) => (
    <select ref={ref} className={`input-base ${error ? 'input-error' : ''} ${className}`} {...rest}>
      {children}
    </select>
  ),
);

Select.displayName = 'Select';
