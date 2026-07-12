import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { isMockAdminEnabled } from '@/lib/admin/mock-auth';
import {
  EVENT_ASSET_ALLOWED_CONTENT_TYPES,
  EVENT_ASSET_MAX_SIZE_BYTES,
} from '@/lib/admin/assets/domain';
import {
  eventAssetFolder,
  requireAssetAccess,
} from '@/lib/admin/assets/server';
import { EventAssetUploadPayloadSchema } from '@/lib/admin/assets/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  if (!isMockAdminEnabled) {
    return NextResponse.json(
      { error: 'Asset uploads are disabled in this environment.' },
      { status: 401 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  try {
    if (body.type === 'blob.generate-client-token') {
      requireAssetAccess(request);
    }

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsedPayload = EventAssetUploadPayloadSchema.parse(
          JSON.parse(clientPayload ?? '{}'),
        );
        const expectedFolder = `${eventAssetFolder(
          parsedPayload.eventId,
          parsedPayload.assetId,
        )}/`;

        if (!pathname.startsWith(expectedFolder) || pathname.includes('..')) {
          throw new Error('The upload pathname is not authorized for this event.');
        }

        return {
          allowedContentTypes: [...EVENT_ASSET_ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: EVENT_ASSET_MAX_SIZE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60 * 60 * 24 * 30,
          tokenPayload: JSON.stringify(parsedPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info('Club Bahia event asset upload completed', {
          pathname: blob.pathname,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Asset upload failed.' },
      { status: 400 },
    );
  }
}
