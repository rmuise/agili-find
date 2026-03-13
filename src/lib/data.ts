import type { Trial } from './types';

export const MOCK_TRIALS: Trial[] = [
  {
    id: 'trial-001',
    name: 'Rideau Valley Spring Classic',
    org: 'AKC',
    startDate: '2026-04-05',
    endDate: '2026-04-06',
    city: 'Nepean',
    province: 'ON',
    venueName: 'Corkstown Arena',
    venueAddress: '1765 Corkstown Rd, Nepean, ON K2H 8W1',
    distanceKm: 18,
    status: 'low',
    spotsTotal: 200,
    spotsFilled: 188,
    spotsRemaining: 12,
    registrationCloses: '2026-03-28',
    levels: ['Novice', 'Open', 'Advanced', 'Masters'],
    rings: 2,
    entryFee: 28,
    entrySoftware: 'Javadog',
    entryUrl: 'https://javadog.io',
    hostClub: 'Rideau Valley DTC',
    surface: 'Rubber matting over concrete',
    parking: 'Free on-site. Trailers welcome east lot only.',
    crating: 'Indoor available first-come. Outdoor pop-ups permitted.',
    featured: true,
    classes: [
      { name: 'Standard', levels: ['Novice', 'Open', 'Excellent A', 'Excellent B', 'Premier'], ring: 1, spotsRemaining: 4 },
      { name: 'JWW', levels: ['Novice', 'Open', 'Excellent A', 'Excellent B', 'Premier'], ring: 2 },
      { name: 'FAST', levels: ['Novice', 'Open', 'Excellent'], ring: 1 },
      { name: 'T2B', levels: ['All heights'], ring: 2 },
      { name: 'ISC', levels: ['Open', 'Excellent'], ring: 1 },
    ],
    judges: [
      { id: 'j1', firstName: 'Margaret', lastName: 'Llewellyn', initials: 'ML', classes: ['Standard', 'JWW', 'FAST'], ring: 1, days: 'Both days' },
      { id: 'j2', firstName: 'David', lastName: 'Parrish', initials: 'DP', classes: ['Standard', 'JWW', 'T2B', 'ISC'], ring: 2, days: 'Both days' },
    ],
  },
  {
    id: 'trial-002',
    name: 'Capital City USDAA Spring Trial',
    org: 'USDAA',
    startDate: '2026-04-12',
    endDate: '2026-04-13',
    city: 'Ottawa',
    province: 'ON',
    venueName: 'Carleton University Field House',
    distanceKm: 4,
    status: 'registering',
    levels: ['P1', 'P2', 'P3', 'Masters'],
    rings: 2,
    entryFee: 32,
    entrySoftware: 'USDAA',
    classes: [
      { name: 'Standard', levels: ['P1', 'P2', 'P3', 'Masters'] },
      { name: 'Gamblers', levels: ['P1', 'P2', 'P3', 'Masters'] },
      { name: 'Snooker', levels: ['P1', 'P2', 'P3', 'Masters'] },
      { name: 'Jumpers', levels: ['P1', 'P2', 'P3', 'Masters'] },
      { name: 'Relay', levels: ['P2', 'P3', 'Masters'] },
    ],
    judges: [
      { id: 'j3', firstName: 'Sandra', lastName: 'Kimura', initials: 'SK', classes: ['Standard', 'Gamblers'], ring: 1, days: 'Both days' },
    ],
  },
  {
    id: 'trial-003',
    name: 'Eastern Ontario CPE Fun Match',
    org: 'CPE',
    startDate: '2026-04-19',
    endDate: '2026-04-19',
    city: 'Kemptville',
    province: 'ON',
    venueName: 'North Grenville Fairgrounds',
    distanceKm: 54,
    status: 'open',
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    rings: 1,
    entryFee: 22,
    classes: [
      { name: 'Standard', levels: ['L1', 'L2', 'L3', 'L4', 'L5'] },
      { name: 'Colors', levels: ['L1', 'L2', 'L3', 'L4', 'L5'] },
      { name: 'Snooker', levels: ['L2', 'L3', 'L4', 'L5'] },
      { name: 'Wildcard', levels: ['L3', 'L4', 'L5'] },
    ],
  },
  {
    id: 'trial-004',
    name: 'Gatineau Agility Weekend',
    org: 'UKI',
    startDate: '2026-04-26',
    endDate: '2026-04-27',
    city: 'Gatineau',
    province: 'QC',
    venueName: 'Parc des Cèdres',
    distanceKm: 11,
    status: 'open',
    levels: ['Starters', 'Advanced', 'Masters'],
    rings: 2,
    entryFee: 30,
    classes: [
      { name: 'Agility', levels: ['Starters', 'Advanced', 'Masters'] },
      { name: 'Jumping', levels: ['Starters', 'Advanced', 'Masters'] },
      { name: 'International', levels: ['Masters'] },
      { name: 'Select', levels: ['Advanced', 'Masters'] },
    ],
  },
  {
    id: 'trial-005',
    name: 'Manotick Dog Sport Association Trial',
    org: 'NADAC',
    startDate: '2026-05-03',
    endDate: '2026-05-03',
    city: 'Manotick',
    province: 'ON',
    venueName: 'Rideau Valley Fairgrounds',
    distanceKm: 26,
    status: 'soon',
    registrationCloses: '2026-04-15',
    levels: ['Novice', 'Open', 'Elite'],
    rings: 1,
    entryFee: 18,
    classes: [
      { name: 'Agility', levels: ['Novice', 'Open', 'Elite'] },
      { name: 'Tunnelers', levels: ['Novice', 'Open', 'Elite'] },
      { name: 'Weavers', levels: ['Novice', 'Open', 'Elite'] },
      { name: 'Chances', levels: ['Open', 'Elite'] },
    ],
  },
  {
    id: 'trial-006',
    name: 'CKC National Qualifier – East',
    org: 'CKC',
    startDate: '2026-05-10',
    endDate: '2026-05-11',
    city: 'Kingston',
    province: 'ON',
    venueName: "Leon's Centre Annex",
    distanceKm: 196,
    status: 'registering',
    levels: ['Advanced', 'Masters'],
    rings: 3,
    entryFee: 35,
    classes: [
      { name: 'Standard', levels: ['Advanced', 'Masters'] },
      { name: 'Jumpers', levels: ['Advanced', 'Masters'] },
      { name: 'Gamblers', levels: ['Masters'] },
    ],
  },
  {
    id: 'trial-007',
    name: 'Valley Dog Club Spring AKC Trial',
    org: 'AKC',
    startDate: '2026-05-16',
    endDate: '2026-05-17',
    city: 'Brockville',
    province: 'ON',
    venueName: 'Brockville Memorial Centre',
    distanceKm: 92,
    status: 'open',
    levels: ['Novice', 'Open', 'Advanced', 'Masters'],
    rings: 2,
    entryFee: 28,
    classes: [
      { name: 'Standard', levels: ['Novice', 'Open', 'Excellent A', 'Excellent B'] },
      { name: 'JWW', levels: ['Novice', 'Open', 'Excellent A', 'Excellent B'] },
    ],
  },
];

// ── Utility helpers ──────────────────────────────────────────

export function getTrialById(id: string): Trial | undefined {
  return MOCK_TRIALS.find((t) => t.id === id);
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (startDate === endDate) {
    return start.toLocaleDateString('en-CA', { ...opts, year: 'numeric' });
  }

  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString('en-CA', opts)}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-CA', opts)} – ${end.toLocaleDateString('en-CA', opts)}, ${start.getFullYear()}`;
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function fillPercent(filled?: number, total?: number): number {
  if (!filled || !total) return 0;
  return Math.min(Math.round((filled / total) * 100), 100);
}
