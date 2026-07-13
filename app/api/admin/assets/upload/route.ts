import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import {
  EVENT_ASSET_ALLOWED_CONTENT_TYPES,
  EVENT_ASSET_MAX_SIZE_BYTES,
} from '@/lib/admin/assets/domain';
import { eventAssetFolder } from '@/lib/admin/assets/server';
import { EventAssetUploadPayloadSchema } from '@/lib/admin/assets/validation';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  if (body.type === 'blob.generate-client-token') {
    try {
      requireAdminResourceAccess(request);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unauthorized.' },
        { status: 401 },
      );
    }
  }

  try {
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
