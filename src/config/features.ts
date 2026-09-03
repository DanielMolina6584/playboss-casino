// ---------------------------------------------------------------------------
// Flags de features controlables por entorno (variables VITE_* en .env),
// para poder mostrar/ocultar secciones sin tocar código cuando todavía no
// hay datos reales conectados desde la API. Agregar flags nuevos aquí en
// vez de repetir "import.meta.env.VITE_..." por todo el código.
// ---------------------------------------------------------------------------
export const FEATURE_FLAGS = {
  /** Sección de "Próximos partidos" / cuotas en Home y la página Apuestas. */
  matches: import.meta.env.VITE_FEATURE_MATCHES === 'true',
};
