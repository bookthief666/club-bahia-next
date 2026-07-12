import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { list, put } from '@vercel/blob';
import {
  StoredReservationSchema,
  type ReservationStatus,
  type ReservationSubmission,
  type StoredReservation,
} from '@/lib/reservations/domain';

const RESERVATION_PREFIX = 'club-bahia/private-reservations/';

interface EncryptedEnvelope {
  version: 1;
  algorithm: 'aes-256-gcm';
  iv: string;
  tag: string;
  ciphertext: string;
}

function storageSecret(): string {
  const secret =
    process.env.RESERVATION_DATA_SECRET ||
    process.env.ADMIN_ASSET_UPLOAD_SECRET ||
    '';
  if (secret.length < 16) {
    throw new Error(
      'Reservation storage requires RESERVATION_DATA_SECRET or ADMIN_ASSET_UPLOAD_SECRET.',
    );
  }
  return secret;
}

function encryptionKey(): Buffer {
  return createHash('sha256').update(storageSecret(), 'utf8').digest();
}

function encryptReservation(reservation: StoredReservation): EncryptedEnvelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(reservation), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    iv: iv.toString('base64url'),
    tag: tag.toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
  };
}

function isEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<EncryptedEnvelope>;
  return (
    envelope.version === 1 &&
    envelope.algorithm === 'aes-256-gcm' &&
    typeof envelope.iv === 'string' &&
    typeof envelope.tag === 'string' &&
    typeof envelope.ciphertext === 'string'
  );
}

function decryptReservation(envelope: EncryptedEnvelope): StoredReservation {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(envelope.iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  return StoredReservationSchema.parse(JSON.parse(plaintext));
}

function dateParts(value: string): { year: string; month: string } {
  const date = new Date(value);
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
  };
}

function reservationPath(reservation: StoredReservation): string {
  const { year, month } = dateParts(reservation.createdAt);
  return `${RESERVATION_PREFIX}${year}/${month}/${reservation.id}.json.enc`;
}

function createReservationId(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const random = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `CB-${date}-${random}`;
}

export function isReservationStorageConfigured(): boolean {
  try {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN && storageSecret());
  } catch {
    return false;
  }
}

async function saveEncryptedReservation(
  reservation: StoredReservation,
  pathname = reservationPath(reservation),
): Promise<void> {
  const envelope = encryptReservation(reservation);
  await put(pathname, JSON.stringify(envelope), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
    cacheControlMaxAge: 60,
  });
}

export async function createStoredReservation(
  submission: ReservationSubmission,
): Promise<StoredReservation> {
  if (!isReservationStorageConfigured()) {
    throw new Error('Online reservation intake is not configured.');
  }

  const now = new Date().toISOString();
  const reservation: StoredReservation = StoredReservationSchema.parse({
    id: createReservationId(new Date(now)),
    createdAt: now,
    updatedAt: now,
    status: 'new',
    source: 'website',
    firstName: submission.firstName,
    lastName: submission.lastName,
    phone: submission.phone,
    email: submission.email,
    date: submission.date,
    guests: submission.guests,
    occasion: submission.occasion,
    note: submission.note,
    eventId: submission.eventId,
    eventSlug: submission.eventSlug,
    eventTitle: submission.eventTitle,
    consentAt: now,
    staffNote: '',
  });

  await saveEncryptedReservation(reservation);
  return reservation;
}

async function loadEncryptedBlob(url: string): Promise<StoredReservation | null> {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const raw = (await response.json()) as unknown;
    if (!isEnvelope(raw)) return null;
    return decryptReservation(raw);
  } catch {
    return null;
  }
}

export async function listStoredReservations(): Promise<StoredReservation[]> {
  if (!isReservationStorageConfigured()) return [];

  const blobs: Array<{ url: string }> = [];
  let cursor: string | undefined;
  do {
    const result = await list({
      prefix: RESERVATION_PREFIX,
      limit: 1000,
      cursor,
    });
    blobs.push(
      ...result.blobs
        .filter((blob) => blob.pathname.endsWith('.json.enc'))
        .map((blob) => ({ url: blob.url })),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor && blobs.length < 5000);

  const reservations = await Promise.all(
    blobs.map(({ url }) => loadEncryptedBlob(url)),
  );
  return reservations
    .filter((item): item is StoredReservation => item !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

export async function updateStoredReservation(input: {
  id: string;
  status: ReservationStatus;
  staffNote?: string;
}): Promise<StoredReservation> {
  if (!isReservationStorageConfigured()) {
    throw new Error('Online reservation intake is not configured.');
  }

  const result = await list({ prefix: RESERVATION_PREFIX, limit: 1000 });
  const match = result.blobs.find((blob) =>
    blob.pathname.endsWith(`/${input.id}.json.enc`),
  );
  if (!match) throw new Error('Reservation request not found.');

  const current = await loadEncryptedBlob(match.url);
  if (!current) throw new Error('Reservation request could not be decrypted.');

  const now = new Date().toISOString();
  const next: StoredReservation = StoredReservationSchema.parse({
    ...current,
    status: input.status,
    staffNote: input.staffNote ?? current.staffNote,
    updatedAt: now,
    contactedAt:
      input.status === 'contacted' ? current.contactedAt ?? now : current.contactedAt,
    confirmedAt:
      input.status === 'confirmed' ? current.confirmedAt ?? now : current.confirmedAt,
    cancelledAt:
      input.status === 'cancelled' ? current.cancelledAt ?? now : current.cancelledAt,
  });

  await saveEncryptedReservation(next, match.pathname);
  return next;
}
