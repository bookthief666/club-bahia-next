import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';
import type { AdminWorkspaceRecord } from '@/lib/admin/workspaces/domain';
import type { MediaLibraryAsset } from './library-domain';
import { MediaLibraryAssetSchema } from './library-validation';

export const MEDIA_LIBRARY_CATALOG_KEY = 'catalog';

export function normalizeMediaLibraryCatalog(value: unknown): MediaLibraryAsset[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => MediaLibraryAssetSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data as MediaLibraryAsset)
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'active' ? -1 : 1;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
}

export async function loadMediaLibraryCatalog(): Promise<{
  record: AdminWorkspaceRecord<MediaLibraryAsset[]> | null;
  assets: MediaLibraryAsset[];
}> {
  const record = await getAdminWorkspaceRecord<MediaLibraryAsset[]>(
    'media-library',
    MEDIA_LIBRARY_CATALOG_KEY,
  );
  return {
    record,
    assets: normalizeMediaLibraryCatalog(record?.value),
  };
}

export async function saveMediaLibraryCatalog(input: {
  assets: MediaLibraryAsset[];
  expectedRevision: number;
  user: AdminUser;
}) {
  return saveAdminWorkspaceRecord({
    kind: 'media-library',
    key: MEDIA_LIBRARY_CATALOG_KEY,
    value: input.assets,
    expectedRevision: input.expectedRevision,
    user: input.user,
  });
}
