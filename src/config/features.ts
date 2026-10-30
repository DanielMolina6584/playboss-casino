// ---------------------------------------------------------------------------
// Flags de features / modo de datos controlados por variables VITE_* (.env).
// Agregar flags nuevos aquí en vez de repetir "import.meta.env.VITE_..." por
// todo el código.
// ---------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  /** Sección de "Próximos partidos" / cuotas en Home y la página Apuestas. */
  matches: import.meta.env.VITE_FEATURE_MATCHES !== 'false',
};

export type DataMode = 'auto' | 'api' | 'mock';

const rawMode = import.meta.env.VITE_DATA_MODE;
/** auto: API con caída a mock si no responde · api: solo API · mock: solo mock. */
export const DATA_MODE: DataMode = rawMode === 'api' || rawMode === 'mock' ? rawMode : 'auto';
