import type { League, Match, Market, Team } from '@/types';

// Datos simulados del catálogo (ligas, equipos, partidos y cuotas). Las fechas
// son relativas a "ahora" para que los filtros Hoy / Mañana siempre tengan datos.

export const leagues: League[] = [
  { id: 'betplay', slug: 'liga-betplay', name: 'Liga BetPlay', country: 'Colombia', active: true },
  {
    id: 'laliga',
    slug: 'laliga',
    name: 'LaLiga',
    country: 'España',
    logo: '/assets/logos/laliga/real_madrid.png',
    active: true,
  },
  {
    id: 'epl',
    slug: 'premier-league',
    name: 'Premier League',
    country: 'Inglaterra',
    logo: '/assets/logos/epl/liverpool.png',
    active: true,
  },
];

const t = (id: string, name: string, logo?: string): Team => ({ id, name, logo });

const col = {
  nacional: t('nacional', 'Atlético Nacional'),
  millonarios: t('millonarios', 'Millonarios'),
  junior: t('junior', 'Junior'),
  america: t('america', 'América de Cali'),
  santaFe: t('santa_fe', 'Santa Fe'),
  tolima: t('tolima', 'Deportes Tolima'),
};
const esp = {
  barcelona: t('barcelona', 'Barcelona', '/assets/logos/laliga/barcelona.png'),
  realMadrid: t('real_madrid', 'Real Madrid', '/assets/logos/laliga/real_madrid.png'),
  atletico: t('atletico_madrid', 'Atlético de Madrid', '/assets/logos/laliga/atletico_madrid.png'),
  sevilla: t('sevilla', 'Sevilla', '/assets/logos/laliga/sevilla.png'),
  valencia: t('valencia', 'Valencia', '/assets/logos/laliga/valencia.png'),
};
const eng = {
  manUnited: t('manchester_united', 'Manchester United', '/assets/logos/epl/manchester_united.png'),
  liverpool: t('liverpool', 'Liverpool', '/assets/logos/epl/liverpool.png'),
  chelsea: t('chelsea', 'Chelsea', '/assets/logos/epl/chelsea.png'),
  arsenal: t('arsenal', 'Arsenal', '/assets/logos/epl/arsenal.png'),
  manCity: t('manchester_city', 'Manchester City', '/assets/logos/epl/manchester_city.png'),
};

function market1x2(matchId: string, home: number, draw: number, away: number): Market {
  return {
    id: `${matchId}-1x2`,
    type: '1X2',
    name: 'Ganador del partido',
    odds: [
      { id: `${matchId}-1`, market: '1X2', selection: '1', label: '1', value: home },
      { id: `${matchId}-x`, market: '1X2', selection: 'X', label: 'X', value: draw },
      { id: `${matchId}-2`, market: '1X2', selection: '2', label: '2', value: away },
    ],
  };
}

const HOUR = 3_600_000;
const now = Date.now();
const at = (hours: number) => new Date(now + hours * HOUR).toISOString();

function match(
  id: string,
  league: League,
  home: Team,
  away: Team,
  hours: number,
  odds: [number, number, number],
  status: Match['status'] = 'scheduled',
): Match {
  return {
    id,
    league,
    homeTeam: home,
    awayTeam: away,
    date: at(hours),
    status,
    markets: [market1x2(id, ...odds)],
  };
}

const [betplay, laliga, epl] = leagues;

export const matches: Match[] = [
  match('m1', laliga, esp.barcelona, esp.realMadrid, 3, [1.85, 3.6, 4.2]),
  match('m4', epl, eng.manUnited, eng.liverpool, 1.5, [3.1, 3.4, 2.15]),
  match('m7', betplay, col.nacional, col.millonarios, 4, [2.1, 3.1, 3.4]),
  match('m8', betplay, col.junior, col.america, 28, [1.95, 3.2, 3.9]),
  match('m2', laliga, esp.atletico, esp.sevilla, 27, [1.7, 3.8, 5.0]),
  match('m5', epl, eng.arsenal, eng.chelsea, 29, [2.05, 3.5, 3.4]),
  match('m9', betplay, col.santaFe, col.tolima, 52, [2.4, 3.0, 2.9]),
  match('m3', laliga, esp.valencia, esp.realMadrid, 54, [4.5, 3.9, 1.65]),
  match('m6', epl, eng.manCity, eng.manUnited, 76, [1.55, 4.1, 5.8]),
  match('m10', betplay, col.millonarios, col.junior, 100, [2.25, 3.1, 3.1]),
  match('m11', epl, eng.liverpool, eng.arsenal, -0.5, [2.2, 3.3, 3.2], 'live'),
];
