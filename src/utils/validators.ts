export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Valida el número de documento según su tipo (códigos de la API):
 * CC/CE/TI son numéricos, PA (pasaporte) y NIT admiten letras/guion.
 */
export function isValidDocumentNumber(documentType: string, value: string): boolean {
  const v = value.trim();
  if (documentType === 'PA') return /^[A-Za-z0-9]{5,15}$/.test(v);
  if (documentType === 'NIT') return /^\d{5,15}-?\d?$/.test(v);
  return /^\d{6,12}$/.test(v);
}

export function isAdult(birthDate: string, minAge = 18): boolean {
  if (!birthDate) return false;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= minAge;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

export function isStrongEnough(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return password.length > 0 && password === confirmation;
}
