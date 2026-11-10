/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Activa la sección de partidos/cuotas (aún sin datos reales conectados). */
  readonly VITE_FEATURE_MATCHES: string;
  /** Clave pública (site key) de reCAPTCHA v3. Vacía = sin reCAPTCHA. */
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  /** ID de cliente OAuth web de Google. Vacío = sin botón de Google. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
