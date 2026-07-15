import type { OperationsEvent } from '@/lib/admin/domain';
import {
  CLUB_BAHIA_TIME_ZONE,
  formatUtcForVenueInput,
  venueInputToUtc,
} from '@/lib/admin/autopilot/venue-time';

export type PromotionTimelineChannel =
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-reel'
  | 'tiktok-video';

export type PromotionTimelinePhase =
  | 'announcement'
  | 'performer-spotlight'
  | 'story-countdown'
  | 'instagram-reel'
  | 'tiktok-video'
  | 'reservation-reminder'
  | 'tomorrow'
  | 'tonight'
  | 'final-hours'
  | 'thank-you';

export interface PromotionTimelineEntry {
  id: string;
  phase: PromotionTimelinePhase;
  label: string;
  purpose: string;
  provider: 'meta' | 'tiktok';
  channel: PromotionTimelineChannel;
  scheduledFor: string;
  venueTime: string;
  compressed: boolean;
  automaticCandidate: boolean;
}

export interface PromotionTimeline {
  eventId: string;
  eventStartsAt: string;
  generatedAt: string;
  timeZone: typeof CLUB_BAHIA_TIME_ZONE;
  cadenceLabel: string;
  compressed: boolean;
  compressionReason?: string;
  entries: PromotionTimelineEntry[];
  skippedPhases: PromotionTimelinePhase[];
}

interface TemplateEntry {
  phase: PromotionTimelinePhase;
  label: string;
  purpose: string;
  provider: 'meta' | 'tiktok';
  channel: PromotionTimelineChannel;
  dayOffset?: number;
  localTime?: string;
  hoursBeforeStart?: number;
  automaticCandidate: boolean;
}

const STANDARD_TEMPLATE: TemplateEntry[] = [
  {
    phase: 'announcement',
    label: 'Main announcement',
    purpose: 'Introduce the event, core attraction, date, and reservation action.',
    provider: 'meta',
    channel: 'instagram-feed',
    dayOffset: -14,
    localTime: '12:00',
    automaticCandidate: true,
  },
  {
    phase: 'performer-spotlight',
    label: 'Performer spotlight',
    purpose: 'Give the featured DJ, band, host, or promoter a focused shareable post.',
    provider: 'meta',
    channel: 'instagram-story',
    dayOffset: -10,
    localTime: '18:00',
    automaticCandidate: false,
  },
  {
    phase: 'story-countdown',
    label: 'Story countdown',
    purpose: 'Start a visible countdown and reinforce the event identity.',
    provider: 'meta',
    channel: 'instagram-story',
    dayOffset: -7,
    localTime: '17:30',
    automaticCandidate: false,
  },
  {
    phase: 'instagram-reel',
    label: 'Instagram Reel',
    purpose: 'Publish the strongest short vertical-video introduction.',
    provider: 'meta',
    channel: 'instagram-reel',
    dayOffset: -5,
    localTime: '18:30',
    automaticCandidate: false,
  },
  {
    phase: 'tiktok-video',
    label: 'TikTok vertical video',
    purpose: 'Publish the platform-specific short-video edit and caption.',
    provider: 'tiktok',
    channel: 'tiktok-video',
    dayOffset: -4,
    localTime: '19:00',
    automaticCandidate: false,
  },
  {
    phase: 'reservation-reminder',
    label: 'Reservation reminder',
    purpose: 'Restate the value of the night and make the reservation action obvious.',
    provider: 'meta',
    channel: 'instagram-feed',
    dayOffset: -3,
    localTime: '18:00',
    automaticCandidate: true,
  },
  {
    phase: 'tomorrow',
    label: 'Tomorrow Story',
    purpose: 'Give followers a simple next-day reminder with the essential facts.',
    provider: 'meta',
    channel: 'instagram-story',
    dayOffset: -1,
    localTime: '18:00',
    automaticCandidate: false,
  },
  {
    phase: 'tonight',
    label: 'Tonight Story',
    purpose: 'Reach followers making same-day plans.',
    provider: 'meta',
    channel: 'instagram-story',
    hoursBeforeStart: 5,
    automaticCandidate: false,
  },
  {
    phase: 'final-hours',
    label: 'Final-hours Story',
    purpose: 'Provide one final factual reminder shortly before the event begins.',
    provider: 'meta',
    channel: 'instagram-story',
    hoursBeforeStart: 2,
    automaticCandidate: false,
  },
  {
    phase: 'thank-you',
    label: 'Thank-you and next action',
    purpose: 'Thank attendees and direct interest toward the next Club Bahia event.',
    provider: 'meta',
    channel: 'instagram-feed',
    dayOffset: 1,
    localTime: '12:00',
    automaticCandidate: true,
  },
];

const RESIDENT_WEEKEND_TEMPLATE: TemplateEntry[] = [
  {
    phase: 'announcement',
    label: 'Weekly announcement',
    purpose: 'Confirm this week’s resident live night and its essential details.',
    provider: 'meta',
    channel: 'instagram-feed',
    dayOffset: -7,
    localTime: '12:00',
    automaticCandidate: true,
  },
  {
    phase: 'story-countdown',
    label: 'Midweek Story',
    purpose: 'Remind followers that the resident live night returns this week.',
    provider: 'meta',
    channel: 'instagram-story',
    dayOffset: -4,
    localTime: '17:30',
    automaticCandidate: false,
  },
  {
    phase: 'instagram-reel',
    label: 'Instagram Reel',
    purpose: 'Reuse the strongest approved live-band or dance-floor vertical video.',
    provider: 'meta',
    channel: 'instagram-reel',
    dayOffset: -3,
    localTime: '18:30',
    automaticCandidate: false,
  },
  {
    phase: 'tiktok-video',
    label: 'TikTok vertical video',
    purpose: 'Publish a platform-native cut of the approved recurring-night video.',
    provider: 'tiktok',
    channel: 'tiktok-video',
    dayOffset: -2,
    localTime: '19:00',
    automaticCandidate: false,
  },
  {
    phase: 'reservation-reminder',
    label: 'Tomorrow reservation reminder',
    purpose: 'Give guests one clear final reservation action the day before.',
    provider: 'meta',
    channel: 'instagram-feed',
    dayOffset: -1,
    localTime: '18:00',
    automaticCandidate: true,
  },
  {
    phase: 'tonight',
    label: 'Tonight Story',
    purpose: 'Reach guests making same-day plans without overposting the recurring night.',
    provider: 'meta',
    channel: 'instagram-story',
    hoursBeforeStart: 5,
    automaticCandidate: false,
  },
  {
    phase: 'thank-you',
    label: 'Thank-you and next weekend',
    purpose: 'Thank attendees and direct interest toward the next resident night.',
    provider: 'meta',
    channel: 'instagram-feed',
    dayOffset: 1,
    localTime: '12:00',
    automaticCandidate: true,
  },
];

const COMPRESSION_PRIORITY: PromotionTimelinePhase[] = [
  'announcement',
  'instagram-reel',
  'tiktok-video',
  'reservation-reminder',
  'tomorrow',
  'tonight',
  'final-hours',
];

function timelineTemplate(event: OperationsEvent): {
  entries: TemplateEntry[];
  label: string;
} {
  if (event.promotionTemplate?.cadence === 'resident-weekend') {
    return {
      entries: RESIDENT_WEEKEND_TEMPLATE,
      label: 'Resident weekend · 7 touches',
    };
  }
  if (event.promotionTemplate?.cadence === 'experimental-launch') {
    return {
      entries: STANDARD_TEMPLATE,
      label: 'Experimental launch · 10 touches',
    };
  }
  return { entries: STANDARD_TEMPLATE, label: 'Standard event · 10 touches' };
}

function venueCalendarInput(
  eventStartsAt: string,
  dayOffset: number,
  localTime: string,
): string | undefined {
  const eventInput = formatUtcForVenueInput(eventStartsAt);
  if (!eventInput) return undefined;
  const datePart = eventInput.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  const shifted = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${localTime}`;
  return venueInputToUtc(shifted);
}

function idealTime(template: TemplateEntry, eventStartsAt: string): string | undefined {
  if (template.hoursBeforeStart !== undefined) {
    const eventTime = new Date(eventStartsAt).getTime();
    if (!Number.isFinite(eventTime)) return undefined;
    return new Date(eventTime - template.hoursBeforeStart * 60 * 60 * 1000).toISOString();
  }
  if (template.dayOffset === undefined || !template.localTime) return undefined;
  return venueCalendarInput(eventStartsAt, template.dayOffset, template.localTime);
}

function compressedLimit(millisecondsUntilEvent: number): number {
  const hours = millisecondsUntilEvent / 3_600_000;
  if (hours >= 168) return 6;
  if (hours >= 72) return 4;
  if (hours >= 24) return 3;
  if (hours >= 8) return 2;
  return 1;
}

function compactSpacing(millisecondsUntilEvent: number): number {
  const hours = millisecondsUntilEvent / 3_600_000;
  if (hours >= 72) return 8 * 3_600_000;
  if (hours >= 24) return 4 * 3_600_000;
  return 2 * 3_600_000;
}

function entryFrom(
  event: OperationsEvent,
  template: TemplateEntry,
  scheduledFor: string,
  compressed: boolean,
): PromotionTimelineEntry {
  return {
    id: `${event.id}-${template.phase}`,
    phase: template.phase,
    label: template.label,
    purpose: template.purpose,
    provider: template.provider,
    channel: template.channel,
    scheduledFor,
    venueTime: formatUtcForVenueInput(scheduledFor),
    compressed,
    automaticCandidate: template.automaticCandidate,
  };
}

export function buildPromotionTimeline(input: {
  event: OperationsEvent;
  now?: Date;
}): PromotionTimeline {
  const now = input.now ?? new Date();
  const eventTime = new Date(input.event.startsAt).getTime();
  if (!Number.isFinite(eventTime)) {
    throw new Error('The event needs a valid start time before a promotion timeline can be built.');
  }

  const selected = timelineTemplate(input.event);
  const nowTime = now.getTime();
  const millisecondsUntilEvent = eventTime - nowTime;
  const ideal = selected.entries
    .map((template) => ({
      template,
      scheduledFor: idealTime(template, input.event.startsAt),
    }))
    .filter(
      (item): item is { template: TemplateEntry; scheduledFor: string } =>
        Boolean(item.scheduledFor),
    );

  const entries: PromotionTimelineEntry[] = [];
  const skipped = new Set<PromotionTimelinePhase>();
  const future = ideal.filter(
    (item) => new Date(item.scheduledFor).getTime() > nowTime + 15 * 60_000,
  );
  for (const item of future) {
    entries.push(entryFrom(input.event, item.template, item.scheduledFor, false));
  }

  const missed = ideal.filter((item) => {
    const scheduled = new Date(item.scheduledFor).getTime();
    return scheduled <= nowTime + 15 * 60_000 && item.template.phase !== 'thank-you';
  });

  if (millisecondsUntilEvent > 90 * 60_000 && missed.length) {
    const futurePhases = new Set(future.map((item) => item.template.phase));
    const candidates = COMPRESSION_PRIORITY.map((phase) =>
      missed.find((item) => item.template.phase === phase),
    ).filter(
      (item): item is { template: TemplateEntry; scheduledFor: string } =>
        Boolean(item && !futurePhases.has(item.template.phase)),
    );
    const limit = Math.min(compressedLimit(millisecondsUntilEvent), candidates.length);
    const spacing = compactSpacing(millisecondsUntilEvent);
    const finalSafeTime = eventTime - 90 * 60_000;
    let cursor = nowTime + 30 * 60_000;

    for (const item of candidates.slice(0, limit)) {
      if (cursor > finalSafeTime) {
        skipped.add(item.template.phase);
        continue;
      }
      entries.push(
        entryFrom(input.event, item.template, new Date(cursor).toISOString(), true),
      );
      cursor += spacing;
    }
  }

  const included = new Set(entries.map((entry) => entry.phase));
  for (const item of ideal) {
    if (!included.has(item.template.phase)) skipped.add(item.template.phase);
  }

  entries.sort(
    (left, right) =>
      new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime(),
  );
  const compressed = entries.some((entry) => entry.compressed);

  return {
    eventId: input.event.id,
    eventStartsAt: input.event.startsAt,
    generatedAt: now.toISOString(),
    timeZone: CLUB_BAHIA_TIME_ZONE,
    cadenceLabel: selected.label,
    compressed,
    compressionReason: compressed
      ? 'The event was entered after part of the ideal campaign window, so missed high-value posts were redistributed into safe future slots.'
      : undefined,
    entries,
    skippedPhases: [...skipped],
  };
}
