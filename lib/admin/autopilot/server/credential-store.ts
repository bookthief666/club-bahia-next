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
