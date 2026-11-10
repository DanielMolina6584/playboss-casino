import { DATA_MODE } from '@/config/features';

// Claves públicas de reCAPTCHA v3 y Google Identity Services. Si están vacías,
// la función correspondiente se omite (no se carga el script ni se muestra el botón).
export const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim();
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

/** Credencial simulada que entiende authService en modo mock. */
export const MOCK_GOOGLE_CREDENTIAL = 'mock-google';

/** Hay botón de Google que mostrar: client id real, o botón simulado en modo mock. */
export const GOOGLE_BUTTON_AVAILABLE = !!GOOGLE_CLIENT_ID || DATA_MODE === 'mock';
