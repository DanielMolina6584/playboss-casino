/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Activa la sección de partidos/cuotas (aún sin datos reales conectados). */
  readonly VITE_FEATURE_MATCHES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
