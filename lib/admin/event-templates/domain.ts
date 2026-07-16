import type { LocalDate } from '@/lib/admin/date';

export type RecurringEventTemplateId =
  | 'azucar-friday'
  | 'azucar-saturday'
  | 'bahia-nocturna';

export type PromotionCadenceId =
  | 'resident-weekend'
  | 'experimental-launch'
  | 'standard';

export interface EventPromotionTemplateSnapshot {
  schemaVersion: 1;
  id: RecurringEventTemplateId;
  name: string;
  summary: string;
  eventTitleBase: string;
  concept: string;
  preferredWeekday: number;
  startTime: string;
  room: string;
  performers: string;
  genres: string;
  admission: string;
  ageRestriction: string;
  targetAudience: string;
  tone: string;
  offer: string;
  language: 'english' | 'spanish' | 'bilingual';
  cadence: PromotionCadenceId;
  hashtags: {
    branded: string[];
    localDiscovery: string[];
    musicCommunity: string[];
  };
  visualDirection: string;
  preferredMediaRoles: Array<
    'primary-flyer' | 'feed-creative' | 'story-creative' | 'reel-video' | 'venue-photo'
  >;
}

const templates: EventPromotionTemplateSnapshot[] = [
  {
    schemaVersion: 1,
    id: 'azucar-friday',
    name: 'Azucar LA — Friday',
    summary: 'Resident Friday live Latin dance night with a lighter recurring-week cadence.',
    eventTitleBase: 'Azucar LA',
    concept:
      'Azucar LA brings live cumbia, merengue, salsa, bachata, and Latin dance music to Club Bahia for a welcoming Friday night of live music and dancing.',
    preferredWeekday: 5,
    startTime: '21:00',
    room: 'Main room',
    performers: 'Azucar LA',
    genres: 'live cumbia, merengue, salsa, bachata, Latin dance music',
    admission: '',
    ageRestriction: '',
    targetAudience:
      'Club Bahia regulars, Latin dance-music audiences, couples, groups, and nearby Los Angeles nightlife guests',
    tone: 'energetic, warm, social, rhythmic, and welcoming',
    offer: 'Reserve your Friday night',
    language: 'bilingual',
    cadence: 'resident-weekend',
    hashtags: {
      branded: ['#ClubBahia', '#AzucarLA'],
      localDiscovery: ['#EchoPark', '#LosAngelesNightlife', '#SunsetBoulevard'],
      musicCommunity: ['#Cumbia', '#Salsa', '#Bachata', '#Merengue'],
    },
    visualDirection:
      'Live-band energy, dancing couples, warm amber and red stage light, elegant tropical nightlife atmosphere, authentic Club Bahia crowd photography.',
    preferredMediaRoles: [
      'primary-flyer',
      'reel-video',
      'venue-photo',
      'story-creative',
    ],
  },
  {
    schemaVersion: 1,
    id: 'azucar-saturday',
    name: 'Azucar LA — Saturday',
    summary: 'Resident Saturday live Latin dance night with a high-energy weekend cadence.',
    eventTitleBase: 'Azucar LA',
    concept:
      'Azucar LA brings live cumbia, merengue, salsa, bachata, and Latin dance music to Club Bahia for a high-energy Saturday night of live music and dancing.',
    preferredWeekday: 6,
    startTime: '21:00',
    room: 'Main room',
    performers: 'Azucar LA',
    genres: 'live cumbia, merengue, salsa, bachata, Latin dance music',
    admission: '',
    ageRestriction: '',
    targetAudience:
      'Club Bahia regulars, Latin dance-music audiences, celebratory groups, couples, and Los Angeles weekend nightlife guests',
    tone: 'high-energy, celebratory, warm, stylish, and welcoming',
    offer: 'Reserve your Saturday night',
    language: 'bilingual',
    cadence: 'resident-weekend',
    hashtags: {
      branded: ['#ClubBahia', '#AzucarLA'],
      localDiscovery: ['#EchoPark', '#LosAngelesNightlife', '#SaturdayNightLA'],
      musicCommunity: ['#Cumbia', '#Salsa', '#Bachata', '#Merengue'],
    },
    visualDirection:
      'Packed Saturday dance floor, live musicians, dynamic movement, warm red and amber stage light, celebratory tropical nightlife atmosphere.',
    preferredMediaRoles: [
      'primary-flyer',
      'reel-video',
      'feed-creative',
      'story-creative',
    ],
  },
  {
    schemaVersion: 1,
    id: 'bahia-nocturna',
    name: 'Bahía Nocturna — experimental Thursday',
    summary: 'Monthly darkwave and Latin-alternative pilot with a longer launch cadence.',
    eventTitleBase: 'Bahía Nocturna',
    concept:
      'A monthly Thursday experiment at Club Bahia combining darkwave, post-punk, goth, synth, and Latin-alternative selections with dramatic lighting and a welcoming alternative crowd.',
    preferredWeekday: 4,
    startTime: '21:00',
    room: 'Main room',
    performers: '',
    genres: 'darkwave, post-punk, goth, synth, Latin alternative',
    admission: '',
    ageRestriction: '',
    targetAudience:
      'Echo Park and Los Angeles darkwave, goth, post-punk, synth, and Latin-alternative audiences',
    tone: 'dark, cinematic, stylish, underground, inclusive, and inviting',
    offer: 'Reserve your night',
    language: 'bilingual',
    cadence: 'experimental-launch',
    hashtags: {
      branded: ['#ClubBahia', '#BahiaNocturna'],
      localDiscovery: ['#EchoPark', '#LosAngelesNightlife', '#NELA'],
      musicCommunity: ['#DarkwaveLA', '#PostPunkLA', '#GothLA', '#LatinAlternative'],
    },
    visualDirection:
      'Dark tropical noir, red and green light, defined silhouettes, analog texture, dramatic negative space, elegant underground club atmosphere without generic horror imagery.',
    preferredMediaRoles: [
      'primary-flyer',
      'reel-video',
      'story-creative',
      'venue-photo',
    ],
  },
];

export const RECURRING_EVENT_TEMPLATES = templates.map((template) => ({
  ...template,
  hashtags: {
    branded: [...template.hashtags.branded],
    localDiscovery: [...template.hashtags.localDiscovery],
    musicCommunity: [...template.hashtags.musicCommunity],
  },
  preferredMediaRoles: [...template.preferredMediaRoles],
}));

export function getRecurringEventTemplate(
  id: RecurringEventTemplateId,
): EventPromotionTemplateSnapshot {
  const template = RECURRING_EVENT_TEMPLATES.find((entry) => entry.id === id);
  if (!template) throw new Error('Recurring event template not found.');
  return JSON.parse(JSON.stringify(template)) as EventPromotionTemplateSnapshot;
}

function localDateDay(value: LocalDate): number {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function shiftLocalDate(value: LocalDate, days: number): LocalDate {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10) as LocalDate;
}

export function nextTemplateDate(
  today: LocalDate,
  template: Pick<EventPromotionTemplateSnapshot, 'preferredWeekday'>,
): LocalDate {
  const current = localDateDay(today);
  const delta = ((template.preferredWeekday - current + 7) % 7) || 7;
  return shiftLocalDate(today, delta);
}

export function templateEventTitle(
  template: Pick<EventPromotionTemplateSnapshot, 'eventTitleBase'>,
  date: LocalDate,
): string {
  const [year, month, day] = date.split('-').map(Number);
  const label = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return `${template.eventTitleBase} — ${label}`;
}
