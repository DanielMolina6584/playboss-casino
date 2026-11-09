// La API devuelve las selecciones de una apuesta solo con el id del partido.
// Se recuerda "Local vs Visitante" cada vez que el front lo conoce (catálogo o
// al apostar) para mostrar un texto útil en Mis apuestas.
const KEY = 'playboss_match_labels';
let cache: Record<string, string> | null = null;

function load(): Record<string, string> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    cache = {};
  }
  return cache;
}

export function rememberMatchLabels(entries: { id: string; label: string }[]): void {
  const c = load();
  let changed = false;
  entries.forEach(({ id, label }) => {
    if (c[id] !== label) {
      c[id] = label;
      changed = true;
    }
  });
  if (!changed) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* noop */
  }
}

export function matchLabelFor(id: string): string {
  return load()[id] ?? `Partido #${id}`;
}
