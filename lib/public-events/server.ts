import 'server-only';

import { del, list, put } from '@vercel/blob';
import { bahiaEvents } from '@/lib/events/bahia-events';
import {
  PublicEventSnapshotSchema,
  type PublicEventCard,
  type PublicEventSnapshot,
  type PublicEventVisibility,
} from '@/lib/public-events/domain';

const PUBLIC_EVENT_PREFIX = 'club-bahia/public-events/';

function losAngelesDateLabel(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function losAngelesTimeLabel(startsAt: string, endsAt?: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  });
  const start = formatter.format(new Date(startsAt));
  const end = endsAt ? formatter.format(new Date(endsAt)) : '';
  return end ? `${start}–${end}` : start;
}

function snapshotPath(slug: string): string {
  return `${PUBLIC_EVENT_PREFIX}${slug}/event.json`;
}

function snapshotToCard(snapshot: PublicEventSnapshot): PublicEventCard {
  const query = new URLSearchParams({ event: snapshot.slug });
  return {
    id: snapshot.id,
    slug: snapshot.slug,
    title: snapshot.title,
    eyebrow: snapshot.eyebrow,
    category: snapshot.category,
    programType: snapshot.programType,
    summary: snapshot.summary,
    description: snapshot.websiteCopy,
    startsAt: snapshot.startsAt,
    endsAt: snapshot.endsAt,
    dateLabel: losAngelesDateLabel(snapshot.startsAt),
    timeLabel: snapshot.doorsTime || losAngelesTimeLabel(snapshot.startsAt, snapshot.endsAt),
    room: snapshot.room,
    performers: snapshot.performers,
    genres: snapshot.genres,
    doorsTime: snapshot.doorsTime,
    admission: snapshot.admission,
    ageRestriction: snapshot.ageRestriction,
    foodDrinkSpecial: snapshot.foodDrinkSpecial,
    address: snapshot.address,
    reservationHref:
      snapshot.reservationUrl || `/reservations?${query.toString()}`,
    ticketUrl: snapshot.ticketUrl,
    imageUrl: snapshot.imageUrl,
    imageAlt: snapshot.imageAlt || `${snapshot.title} at Club Bahia`,
    status: snapshot.statusLabel,
    ctaLabel: snapshot.ticketUrl ? 'Buy tickets' : 'Request reservation',
    isFeatured: snapshot.isFeatured,
    source: 'snapshot',
  };
}

function fallbackCards(): PublicEventCard[] {
  return bahiaEvents
    .filter((event) => event.isPublished)
    .map((event) => ({
      id: `fallback-${event.slug}`,
      slug: event.slug,
      title: event.title,
      eyebrow: event.eyebrow,
      category: event.category,
      programType: event.programType,
      summary: event.description,
      description: event.description,
      dateLabel: event.dateLabel,
      timeLabel: event.timeLabel,
      room: event.room,
      performers: event.performers,
      genres: event.genres,
      doorsTime: event.doorsTime,
      admission: event.admission,
      ageRestriction: event.ageRestriction,
      foodDrinkSpecial: event.foodDrinkSpecial,
      address: event.address,
      reservationHref: event.reservationHref,
      ticketUrl: event.ticketUrl,
      imageUrl: event.image.src,
      imageAlt: event.image.alt,
      status: event.status,
      ctaLabel: event.ctaLabel,
      isFeatured: event.isFeatured,
      source: 'fallback' as const,
    }));
}

async function fetchSnapshot(url: string): Promise<PublicEventSnapshot | null> {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const parsed = PublicEventSnapshotSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function isPublicEventStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function listPublicEventSnapshots(
  visibility: PublicEventVisibility = 'public',
): Promise<PublicEventSnapshot[]> {
  if (!isPublicEventStorageConfigured()) return [];

  const blobs: Array<{ url: string }> = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: PUBLIC_EVENT_PREFIX,
      limit: 1000,
      cursor,
    });
    blobs.push(
      ...result.blobs
        .filter((blob) => blob.pathname.endsWith('/event.json'))
        .map((blob) => ({ url: blob.url })),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor && blobs.length < 500);

  const snapshots = await Promise.all(blobs.map(({ url }) => fetchSnapshot(url)));
  return snapshots
    .filter((snapshot): snapshot is PublicEventSnapshot => snapshot !== null)
    .filter((snapshot) => snapshot.visibility === visibility)
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );
}

export async function listPublicEventCards(options?: {
  includePreview?: boolean;
}): Promise<PublicEventCard[]> {
  const [published, preview] = await Promise.all([
    listPublicEventSnapshots('public'),
    options?.includePreview ? listPublicEventSnapshots('preview') : Promise.resolve([]),
  ]);
  const snapshots = [...published, ...preview];
  const cards = snapshots.map(snapshotToCard);
  const seen = new Set(cards.map((card) => card.slug));
  const fallbacks = fallbackCards().filter((card) => !seen.has(card.slug));
  return [...cards, ...fallbacks];
}

export async function getPublicEventCard(
  slug: string,
  options?: { includePreview?: boolean },
): Promise<PublicEventCard | null> {
  const cards = await listPublicEventCards(options);
  return cards.find((card) => card.slug === slug) ?? null;
}

export async function savePublicEventSnapshot(
  input: PublicEventSnapshot,
): Promise<PublicEventSnapshot> {
  if (!isPublicEventStorageConfigured()) {
    throw new Error('Public event storage is not configured.');
  }
  const snapshot = PublicEventSnapshotSchema.parse(input);
  await put(snapshotPath(snapshot.slug), JSON.stringify(snapshot), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  return snapshot;
}

export async function deletePublicEventSnapshot(slug: string): Promise<void> {
  if (!isPublicEventStorageConfigured()) return;
  const result = await list({ prefix: snapshotPath(slug), limit: 10 });
  const urls = result.blobs
    .filter((blob) => blob.pathname === snapshotPath(slug))
    .map((blob) => blob.url);
  if (urls.length) await del(urls);
}
