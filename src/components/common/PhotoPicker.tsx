import { useEffect, useId, useRef, useState } from 'react';

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_MB = 3;

/** Devuelve el error de la foto o null si es válida (jpg, png o webp de máximo 3 MB). */
export function validatePhoto(file: File | null): string | null {
  if (!file) return 'La foto de perfil es obligatoria.';
  if (!PHOTO_TYPES.includes(file.type)) return 'La foto debe ser JPG, PNG o WEBP.';
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `La foto no puede pesar más de ${PHOTO_MAX_MB} MB.`;
  return null;
}

interface PhotoPickerProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  /** Imagen que se muestra mientras no se ha elegido una nueva. */
  currentUrl?: string;
  label?: string;
}

/** Selector de foto de perfil con vista previa circular. */
export function PhotoPicker({ value, onChange, error, currentUrl, label = 'Elegir foto' }: PhotoPickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>();

  useEffect(() => {
    if (!value) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const shown = preview ?? currentUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors ${
          error ? 'border-red-500/70' : 'border-gold/40 hover:border-gold'
        } bg-bg-secondary`}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {shown ? (
          <img src={shown} alt="Vista previa de la foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-text-secondary">Sube tu foto</span>
        )}
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-gold hover:text-gold-secondary">
        {shown ? 'Cambiar foto' : label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        className="sr-only"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      <p className="text-xs text-text-secondary">JPG, PNG o WEBP · máx. {PHOTO_MAX_MB} MB</p>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
