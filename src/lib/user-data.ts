import type { Notification, SavedSearch, User } from './types';
import { DEFAULT_ALERT_PREFS } from './types';

// ── Mock Notifications ──────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'closing',
    title: 'Rideau Valley Spring Classic — closing in 3 days',
    body: 'You saved this trial. Only 12 spots remain and registration closes March 28.',
    trialId: 'trial-001',
    trialName: 'Rideau Valley Spring Classic',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    type: 'new-trial',
    title: 'New CPE trial matched your Ottawa search',
    body: 'Eastern Ontario CPE Fun Match — Apr 19 in Kemptville, ON (54 km). Levels 1–5, open registration.',
    trialId: 'trial-003',
    trialName: 'Eastern Ontario CPE Fun Match',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    type: 'reminder',
    title: 'Manotick NADAC — registration opens April 1',
    body: 'You saved this trial. Registration opens in 18 days. We\'ll remind you again 3 days before.',
    trialId: 'trial-005',
    trialName: 'Manotick Dog Sport Association Trial',
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    type: 'reg-open',
    title: 'Capital City USDAA — registration is now open',
    body: 'Registration for April 12–13 in Ottawa is now open on USDAA\'s entry system.',
    trialId: 'trial-002',
    trialName: 'Capital City USDAA Spring Trial',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n5',
    type: 'new-trial',
    title: '2 new trials added near Kingston, ON',
    body: 'Your Kingston saved search found 2 new matches — CKC National Qualifier (May 10) and Valley AKC Trial (May 16).',
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Mock Saved Searches ─────────────────────────────────────
export const MOCK_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'ss1',
    label: 'Ottawa · 150 km',
    location: 'Ottawa, ON',
    distanceKm: 150,
    orgs: ['AKC', 'USDAA', 'CPE', 'NADAC', 'UKI'],
    levels: ['Novice', 'Open', 'Advanced', 'Masters'],
    alertsEnabled: true,
    newMatchCount: 3,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ss2',
    label: 'Kingston · 100 km',
    location: 'Kingston, ON',
    distanceKm: 100,
    orgs: ['CKC', 'AKC'],
    levels: ['Advanced', 'Masters'],
    alertsEnabled: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Mock User ───────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'user-001',
  firstName: 'Rob',
  lastName: 'Moffitt',
  email: 'rob@example.com',
  avatarInitials: 'RM',
  savedTrialIds: ['trial-001', 'trial-002', 'trial-004', 'trial-005', 'trial-006'],
  savedSearches: MOCK_SAVED_SEARCHES,
  alertPrefs: DEFAULT_ALERT_PREFS,
  homeLocation: 'Manotick, ON',
  homeDistanceKm: 150,
};

// ── Helpers ─────────────────────────────────────────────────
export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(isoString).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export function groupNotificationsByDate(notifications: Notification[]): {
  label: string;
  items: Notification[];
}[] {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];
  const now = Date.now();

  notifications.forEach((n) => {
    const diff = now - new Date(n.createdAt).getTime();
    const hours = diff / 3600000;
    if (hours < 24) today.push(n);
    else if (hours < 48) yesterday.push(n);
    else earlier.push(n);
  });

  const groups = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier });
  return groups;
}
