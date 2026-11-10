import type { League, Market, Match, MatchFilters, MatchStatus } from '@/types';
import { httpClient, toQuery, type ApiEnvelope, type ApiPage } from '@/utils/httpClient';
import { withMock } from '@/services/dataSource';
import { leagues as mockLeagues, matches as mockMatches } from '@/mocks/data';

// Contrato: GET /ligas, GET /partidos, GET /partidos/{id}/mercados (docs/CONTRATOS-API.md)

interface ApiLiga {
  id_liga: number;
  nombre: string;
  pais_codigo?: string;
  pais?: { codigo?: string; nombre?: string } | null;
  logo_url?: string | null;
  activa?: boolean;
}
interface ApiEquipo {
  id_equipo: number;
  nombre: string;
  escudo_url?: string | null;
  escudo_drive_id?: string | null;
}
interface ApiPartido {
  id_partido: number;
  fecha_hora: string;
  estado_codigo: string;
  goles_local?: number | null;
  goles_visitante?: number | null;
  local: ApiEquipo;
  visitante: ApiEquipo;
  jornada?: { temporada?: { liga?: ApiLiga } };
}
interface ApiMercado {
  id: string;
  code: string;
  name: string;
  selections: { code: string; label: string; odd: number }[];
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapLiga(l: ApiLiga): League {
  return {
    id: String(l.id_liga),
    slug: slugify(l.nombre),
    name: l.nombre,
    country: l.pais?.nombre ?? l.pais?.codigo ?? l.pais_codigo ?? '',
    logo: l.logo_url || undefined,
    active: l.activa ?? true,
  };
}

const STATUS: Record<string, MatchStatus> = { PROG: 'scheduled', ENJ: 'live', FIN: 'finished', SUSP: 'suspended' };

function mapMercado(matchId: string, m: ApiMercado): Market {
  return {
    id: m.id,
    type: m.code,
    name: m.name,
    odds: m.selections.map((s) => ({
      id: `${matchId}:${m.id}:${s.code}`,
      market: m.code,
      selection: s.code,
      label: s.label ?? s.code,
      value: Number(s.odd),
    })),
  };
}

/**
 * Ruta del escudo local por nombre del equipo (public/assets/escudos/<slug>.png).
 * Si el archivo no existe, TeamBadge muestra las iniciales.
 */
function escudoUrl(nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `/assets/escudos/${slug}.png`;
}

function mapPartido(p: ApiPartido, markets: Market[]): Match {
  const liga = p.jornada?.temporada?.liga;
  return {
    id: String(p.id_partido),
    league: liga
      ? mapLiga(liga)
      : { id: '0', slug: 'otras', name: 'Otras ligas', country: '', active: true },
    homeTeam: {
      id: String(p.local.id_equipo),
      name: p.local.nombre,
      logo: p.local.escudo_url || escudoUrl(p.local.nombre),
      driveFileId: p.local.escudo_drive_id ?? undefined,
    },
    awayTeam: {
      id: String(p.visitante.id_equipo),
      name: p.visitante.nombre,
      logo: p.visitante.escudo_url || escudoUrl(p.visitante.nombre),
      driveFileId: p.visitante.escudo_drive_id ?? undefined,
    },
    date: p.fecha_hora,
    status: STATUS[p.estado_codigo] ?? 'scheduled',
    homeScore: p.goles_local ?? null,
    awayScore: p.goles_visitante ?? null,
    markets,
  };
}

/** Filtra (solo mock) y ordena. Con la API, liga/fechas/texto (q) los filtra el servidor. */
function applyFilters(list: Match[], f: MatchFilters): Match[] {
  const q = f.q?.trim().toLowerCase();
  const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
  const to = f.to ? new Date(`${f.to}T23:59:59`).getTime() : null;
  return list
    .filter((m) => !f.leagueId || m.league.id === f.leagueId)
    .filter((m) => from === null || new Date(m.date).getTime() >= from)
    .filter((m) => to === null || new Date(m.date).getTime() <= to)
    .filter(
      (m) =>
        !q ||
        `${m.homeTeam.name} ${m.awayTeam.name} ${m.league.name}`.toLowerCase().includes(q),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const matchesService = {
  getLeagues(): Promise<League[]> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiLiga>>>(
          `/ligas${toQuery({ servicio_codigo: 'FUTBOL', per_page: 100 })}`,
          { auth: false },
        );
        return res.data.items.map(mapLiga);
      },
      () => mockLeagues.filter((l) => l.active),
      250,
    );
  },

  /** Partidos programados o en juego, con sus mercados, filtrados por liga/fecha/texto. */
  async getMatches(filters: MatchFilters = {}): Promise<Match[]> {
    return withMock(
      async () => {
        const res = await httpClient.get<ApiEnvelope<ApiPage<ApiPartido>>>(
          `/partidos${toQuery({
            estado: 'PROG',
            per_page: 100,
            liga_id: filters.leagueId,
            q: filters.q?.trim() || undefined,
            desde: filters.from,
            hasta: filters.to,
          })}`,
          { auth: false },
        );
        const withMarkets = await Promise.all(
          res.data.items.map(async (p) => {
            try {
              const mk = await httpClient.get<ApiEnvelope<ApiMercado[]>>(`/partidos/${p.id_partido}/mercados`, {
                auth: false,
              });
              return mapPartido(p, mk.data.map((m) => mapMercado(String(p.id_partido), m)));
            } catch {
              return mapPartido(p, []);
            }
          }),
        );
        return applyFilters(withMarkets, {});
      },
      () => applyFilters(mockMatches, filters),
    );
  },

  /** Un partido con todos sus mercados abiertos (GET /partidos/{id} y /partidos/{id}/mercados). */
  async getMatchById(matchId: string): Promise<Match | undefined> {
    const match = await withMock(
      async () => {
        const [partido, mercados] = await Promise.all([
          httpClient.get<ApiEnvelope<ApiPartido>>(`/partidos/${matchId}`, { auth: false }),
          httpClient.get<ApiEnvelope<ApiMercado[]>>(`/partidos/${matchId}/mercados`, { auth: false }),
        ]);
        return mapPartido(partido.data, mercados.data.map((m) => mapMercado(matchId, m)));
      },
      () => mockMatches.find((m) => m.id === matchId),
    );
    return match;
  },
};
