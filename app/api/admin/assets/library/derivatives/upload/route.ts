import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import {
  mediaLibraryDerivativeFolder,
} from '@/lib/admin/assets/server';
import { MediaDerivativeUploadPayloadSchema } from '@/lib/admin/assets/library-validation';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid derivative upload request.' }, { status: 400 });
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
        const parsed = MediaDerivativeUploadPayloadSchema.parse(
          JSON.parse(clientPayload ?? '{}'),
        );
        const expectedFolder = `${mediaLibraryDerivativeFolder(parsed.libraryAssetId)}/`;
        if (!pathname.startsWith(expectedFolder) || pathname.includes('..')) {
          throw new Error('The derivative pathname is not authorized.');
        }
        return {
          allowedContentTypes: ['image/jpeg'],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30,
          tokenPayload: JSON.stringify(parsed),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info('Club Bahia media derivative upload completed', {
          pathname: blob.pathname,
          tokenPayload,
        });
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Derivative upload failed.' },
      { status: 400 },
    );
  }
}
