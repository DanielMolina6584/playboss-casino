import type {League, Match, Team} from '@/types';

export const leagues: League[] = [
    {
        id: 'laliga',
        name: 'Liga Española',
        country: 'España',
        logo: '/assets/logos/laliga/real_madrid.png',
        active: true,
    },
    {
        id: 'epl',
        name: 'Premier League',
        country: 'Inglaterra',
        logo: '/assets/logos/epl/liverpool.png',
        active: true,
    },
];

const laligaTeams: Record<string, Team> = {
    barcelona: {id: 'barcelona', name: 'Barcelona', logo: '/assets/logos/laliga/barcelona.png'},
    realMadrid: {id: 'real_madrid', name: 'Real Madrid', logo: '/assets/logos/laliga/real_madrid.png'},
    atletico: {id: 'atletico_madrid', name: 'Atlético de Madrid', logo: '/assets/logos/laliga/atletico_madrid.png'},
    sevilla: {id: 'sevilla', name: 'Sevilla', logo: '/assets/logos/laliga/sevilla.png'},
    valencia: {id: 'valencia', name: 'Valencia', logo: '/assets/logos/laliga/valencia.png'},
};

const eplTeams: Record<string, Team> = {
    manUnited: {id: 'manchester_united', name: 'Manchester United', logo: '/assets/logos/epl/manchester_united.png'},
    liverpool: {id: 'liverpool', name: 'Liverpool', logo: '/assets/logos/epl/liverpool.png'},
    chelsea: {id: 'chelsea', name: 'Chelsea', logo: '/assets/logos/epl/chelsea.png'},
    arsenal: {id: 'arsenal', name: 'Arsenal', logo: '/assets/logos/epl/arsenal.png'},
    manCity: {id: 'manchester_city', name: 'Manchester City', logo: '/assets/logos/epl/manchester_city.png'},
};

function buildMarket(matchId: string, home: number, draw: number, away: number) {
    return {
        id: `${matchId}-1x2`,
        type: '1X2' as const,
        name: 'Ganador del partido',
        odds: [
            {id: `${matchId}-1`, market: '1X2' as const, selection: '1' as const, label: '1', value: home},
            {id: `${matchId}-x`, market: '1X2' as const, selection: 'X' as const, label: 'X', value: draw},
            {id: `${matchId}-2`, market: '1X2' as const, selection: '2' as const, label: '2', value: away},
        ],
    };
}

export const matches: Match[] = [
    {
        id: 'm1',
        league: leagues[0],
        homeTeam: laligaTeams.barcelona,
        awayTeam: laligaTeams.realMadrid,
        date: new Date().toISOString(),
        time: 'Hoy · 3:00 PM',
        status: 'scheduled',
        markets: [buildMarket('m1', 1.85, 3.6, 4.2)],
    },
    {
        id: 'm2',
        league: leagues[0],
        homeTeam: laligaTeams.atletico,
        awayTeam: laligaTeams.sevilla,
        date: new Date().toISOString(),
        time: 'Mañana · 1:00 PM',
        status: 'scheduled',
        markets: [buildMarket('m2', 1.7, 3.8, 5.0)],
    },
    {
        id: 'm3',
        league: leagues[0],
        homeTeam: laligaTeams.valencia,
        awayTeam: laligaTeams.realMadrid,
        date: new Date().toISOString(),
        time: 'Sábado · 6:30 PM',
        status: 'scheduled',
        markets: [buildMarket('m3', 4.5, 3.9, 1.65)],
    },
    {
        id: 'm4',
        league: leagues[1],
        homeTeam: eplTeams.manUnited,
        awayTeam: eplTeams.liverpool,
        date: new Date().toISOString(),
        time: 'Hoy · 11:00 AM',
        status: 'scheduled',
        markets: [buildMarket('m4', 3.1, 3.4, 2.15)],
    },
    {
        id: 'm5',
        league: leagues[1],
        homeTeam: eplTeams.arsenal,
        awayTeam: eplTeams.chelsea,
        date: new Date().toISOString(),
        time: 'Mañana · 2:30 PM',
        status: 'scheduled',
        markets: [buildMarket('m5', 2.05, 3.5, 3.4)],
    },
    {
        id: 'm6',
        league: leagues[1],
        homeTeam: eplTeams.manCity,
        awayTeam: eplTeams.manUnited,
        date: new Date().toISOString(),
        time: 'Domingo · 9:00 AM',
        status: 'scheduled',
        markets: [buildMarket('m6', 1.55, 4.1, 5.8)],
    },
];
