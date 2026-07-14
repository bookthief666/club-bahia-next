import 'server-only';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { list, put } from '@vercel/blob';
import type { AdminUser } from '@/lib/admin/domain';
import {
  AdminWorkspaceConflictError,
  adminWorkspacePrefix,
  adminWorkspaceRevisionPath,
  createAdminWorkspaceRecord,
  isAdminWorkspaceRecord,
  type AdminWorkspaceKind,
  type AdminWorkspaceRecord,
} from '@/lib/admin/workspaces/domain';

interface EncryptedAdminWorkspaceEnvelope {
  version: 1;
  algorithm: 'aes-256-gcm';
  iv: string;
  tag: string;
  ciphertext: string;
}

function workspaceStorageSecret(): string {
  const secret =
    process.env.GROWTH_OS_DATA_SECRET ||
    process.env.RESERVATION_DATA_SECRET ||
    process.env.ADMIN_AUTH_SECRET ||
    '';
  if (secret.length < 32) {
    throw new Error(
      'Shared Growth OS storage requires GROWTH_OS_DATA_SECRET, RESERVATION_DATA_SECRET, or ADMIN_AUTH_SECRET with at least 32 characters.',
    );
  }
  return secret;
}

function encryptionKey(): Buffer {
  return createHash('sha256').update(workspaceStorageSecret(), 'utf8').digest();
}

function encryptRecord(
  record: AdminWorkspaceRecord<unknown>,
): EncryptedAdminWorkspaceEnvelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(record), 'utf8');
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

function isEncryptedEnvelope(
  value: unknown,
): value is EncryptedAdminWorkspaceEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<EncryptedAdminWorkspaceEnvelope>;
  return (
    envelope.version === 1 &&
    envelope.algorithm === 'aes-256-gcm' &&
    typeof envelope.iv === 'string' &&
    typeof envelope.tag === 'string' &&
    typeof envelope.ciphertext === 'string'
  );
}

function decryptRecord(
  envelope: EncryptedAdminWorkspaceEnvelope,
): AdminWorkspaceRecord<unknown> {
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
  const parsed = JSON.parse(plaintext) as unknown;
  if (!isAdminWorkspaceRecord(parsed)) {
    throw new Error('Stored Growth OS workspace failed validation.');
  }
  return parsed;
}

export function isAdminWorkspaceStorageConfigured(): boolean {
  try {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN && workspaceStorageSecret());
  } catch {
    return false;
  }
}

async function listRevisionBlobs(
  kind: AdminWorkspaceKind,
  key: string,
): Promise<Array<{ pathname: string; url: string }>> {
  const blobs: Array<{ pathname: string; url: string }> = [];
  let cursor: string | undefined;
  do {
    const result = await list({
      prefix: adminWorkspacePrefix(kind, key),
      limit: 1000,
      cursor,
    });
    blobs.push(
      ...result.blobs
        .filter((blob) => blob.pathname.endsWith('.json.enc'))
        .map((blob) => ({ pathname: blob.pathname, url: blob.url })),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor && blobs.length < 5000);

  return blobs.sort((left, right) =>
    right.pathname.localeCompare(left.pathname),
  );
}

async function loadEncryptedRecord(
  url: string,
): Promise<AdminWorkspaceRecord<unknown> | null> {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const raw = (await response.json()) as unknown;
    if (!isEncryptedEnvelope(raw)) return null;
    return decryptRecord(raw);
  } catch {
    return null;
  }
}

export async function getAdminWorkspaceRecord<T = unknown>(
  kind: AdminWorkspaceKind,
  key: string,
): Promise<AdminWorkspaceRecord<T> | null> {
  if (!isAdminWorkspaceStorageConfigured()) {
    throw new Error('Shared Growth OS storage is not configured.');
  }

  const blobs = await listRevisionBlobs(kind, key);
  for (const blob of blobs) {
    const record = await loadEncryptedRecord(blob.url);
    if (record && record.kind === kind && record.key === key) {
      return record as AdminWorkspaceRecord<T>;
    }
  }
  return null;
}

export async function saveAdminWorkspaceRecord<T>(input: {
  kind: AdminWorkspaceKind;
  key: string;
  value: T;
  expectedRevision: number;
  user: AdminUser;
}): Promise<AdminWorkspaceRecord<T>> {
  if (!isAdminWorkspaceStorageConfigured()) {
    throw new Error('Shared Growth OS storage is not configured.');
  }

  const current = await getAdminWorkspaceRecord(input.kind, input.key);
  const next = createAdminWorkspaceRecord({
    kind: input.kind,
    key: input.key,
    value: input.value,
    actor: input.user,
    expectedRevision: input.expectedRevision,
    current,
  });
  const pathname = adminWorkspaceRevisionPath(
    input.kind,
    input.key,
    next.revision,
  );
  const envelope = encryptRecord(next);

  try {
    await put(pathname, JSON.stringify(envelope), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/octet-stream',
      cacheControlMaxAge: 60,
    });
  } catch (error) {
    const latest = await getAdminWorkspaceRecord(input.kind, input.key);
    if ((latest?.revision ?? 0) >= next.revision) {
      throw new AdminWorkspaceConflictError(
        input.expectedRevision,
        latest?.revision ?? next.revision,
      );
    }
    throw error;
  }

  return next;
}
