import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export type OAuthProvider = 'meta' | 'tiktok';
export type OAuthCredentialStatus = 'connected' | 'needs-attention' | 'disconnected';

export interface OAuthCredentialRecord {
  schemaVersion: 1;
  provider: OAuthProvider;
  status: OAuthCredentialStatus;
  secretMaterial: string;
  renewableMaterial?: string;
  scopes: string[];
  expiresAt?: string;
  renewableUntil?: string;
  accountId: string;
  accountLabel: string;
  accountUsername?: string;
  relatedPageId?: string;
  relatedInstagramId?: string;
  connectedAt: string;
  updatedAt: string;
  lastHealthCheckAt?: string;
  lastHealthError?: string;
}

export interface OAuthCredentialSummary {
  provider: OAuthProvider;
  status: OAuthCredentialStatus;
  scopes: string[];
  expiresAt?: string;
  renewableUntil?: string;
  accountId: string;
  accountLabel: string;
  accountUsername?: string;
  relatedPageId?: string;
  relatedInstagramId?: string;
  connectedAt: string;
  updatedAt: string;
  lastHealthCheckAt?: string;
  lastHealthError?: string;
  renewable: boolean;
}

function workspaceKey(provider: OAuthProvider): string {
  return `oauth_${provider}`;
}

function cleanScopes(scopes: string[]): string[] {
  return Array.from(new Set(scopes.map((scope) => scope.trim()).filter(Boolean))).sort();
}

export function summarizeOAuthCredential(record: OAuthCredentialRecord): OAuthCredentialSummary {
  return {
    provider: record.provider,
    status: record.status,
    scopes: [...record.scopes],
    expiresAt: record.expiresAt,
    renewableUntil: record.renewableUntil,
    accountId: record.accountId,
    accountLabel: record.accountLabel,
    accountUsername: record.accountUsername,
    relatedPageId: record.relatedPageId,
    relatedInstagramId: record.relatedInstagramId,
    connectedAt: record.connectedAt,
    updatedAt: record.updatedAt,
    lastHealthCheckAt: record.lastHealthCheckAt,
    lastHealthError: record.lastHealthError,
    renewable: Boolean(record.renewableMaterial),
  };
}

export async function getOAuthCredential(provider: OAuthProvider) {
  const workspace = await getAdminWorkspaceRecord<OAuthCredentialRecord>(
    'autopilot-credential',
    workspaceKey(provider),
  );
  if (!workspace) return null;
  return { record: workspace.value, revision: workspace.revision };
}

export async function saveOAuthCredential(input: {
  provider: OAuthProvider;
  secretMaterial: string;
  renewableMaterial?: string;
  scopes: string[];
  expiresAt?: string;
  renewableUntil?: string;
  accountId: string;
  accountLabel: string;
  accountUsername?: string;
  relatedPageId?: string;
  relatedInstagramId?: string;
  user: AdminUser;
  now?: Date;
}): Promise<OAuthCredentialRecord> {
  if (input.secretMaterial.trim().length < 20) {
    throw new Error('Provider authorization material was missing or invalid.');
  }
  const current = await getOAuthCredential(input.provider);
  const timestamp = (input.now ?? new Date()).toISOString();
  const record: OAuthCredentialRecord = {
    schemaVersion: 1,
    provider: input.provider,
    status: 'connected',
    secretMaterial: input.secretMaterial.trim(),
    renewableMaterial: input.renewableMaterial?.trim() || undefined,
    scopes: cleanScopes(input.scopes),
    expiresAt: input.expiresAt,
    renewableUntil: input.renewableUntil,
    accountId: input.accountId.trim(),
    accountLabel: input.accountLabel.trim() || input.provider,
    accountUsername: input.accountUsername?.trim() || undefined,
    relatedPageId: input.relatedPageId?.trim() || undefined,
    relatedInstagramId: input.relatedInstagramId?.trim() || undefined,
    connectedAt:
      current?.record.status === 'connected' ? current.record.connectedAt : timestamp,
    updatedAt: timestamp,
  };
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-credential',
    key: workspaceKey(input.provider),
    value: record,
    expectedRevision: current?.revision ?? 0,
    user: input.user,
  });
  return saved.value;
}

export async function updateOAuthCredentialHealth(input: {
  provider: OAuthProvider;
  healthy: boolean;
  user: AdminUser;
  error?: string;
  now?: Date;
}): Promise<OAuthCredentialRecord | null> {
  const current = await getOAuthCredential(input.provider);
  if (!current) return null;
  const timestamp = (input.now ?? new Date()).toISOString();
  const record: OAuthCredentialRecord = {
    ...current.record,
    status: input.healthy ? 'connected' : 'needs-attention',
    lastHealthCheckAt: timestamp,
    lastHealthError: input.healthy
      ? undefined
      : input.error?.slice(0, 1000) || 'Provider health check failed.',
    updatedAt: timestamp,
  };
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-credential',
    key: workspaceKey(input.provider),
    value: record,
    expectedRevision: current.revision,
    user: input.user,
  });
  return saved.value;
}

export async function disconnectOAuthCredential(input: {
  provider: OAuthProvider;
  user: AdminUser;
  now?: Date;
}): Promise<OAuthCredentialRecord | null> {
  const current = await getOAuthCredential(input.provider);
  if (!current) return null;
  const timestamp = (input.now ?? new Date()).toISOString();
  const record: OAuthCredentialRecord = {
    ...current.record,
    status: 'disconnected',
    secretMaterial: '',
    renewableMaterial: undefined,
    expiresAt: undefined,
    renewableUntil: undefined,
    updatedAt: timestamp,
    lastHealthCheckAt: timestamp,
    lastHealthError: undefined,
  };
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-credential',
    key: workspaceKey(input.provider),
    value: record,
    expectedRevision: current.revision,
    user: input.user,
  });
  return saved.value;
}
