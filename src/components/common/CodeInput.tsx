import { useEffect, useRef, useState } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
  resetKey?: number;
}

export function CodeInput({ length = 6, onComplete, error, resetKey }: CodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setValues(Array(length).fill(''));
    inputRefs.current[0]?.focus();
  }, [length, resetKey]);

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((v) => v !== '')) {
      onComplete(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill('');
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setValues(next);
    const lastIndex = Math.min(pasted.length, length) - 1;
    inputRefs.current[lastIndex]?.focus();
    if (pasted.length === length) {
      onComplete(pasted);
    }
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Dígito ${index + 1} de ${length}`}
          className={`h-12 w-11 rounded-lg border bg-bg-secondary text-center text-lg font-bold text-text-primary outline-none transition-all duration-200 focus:ring-2 sm:h-14 sm:w-12 ${
            error ? 'border-red-500/60 focus:ring-red-500/20' : 'border-border-subtle focus:border-gold/60 focus:ring-gold/20'
          }`}
        />
      ))}
    </div>
  );
}
