import { MediaDerivativeWorkspaceClient } from '@/components/admin/assets/MediaDerivativeWorkspaceClient';
import { MediaLibraryClient } from '@/components/admin/assets/MediaLibraryClient';

export const dynamic = 'force-dynamic';

export default function AdminMediaLibraryPage() {
  return (
    <>
      <MediaDerivativeWorkspaceClient />
      <MediaLibraryClient />
    </>
  );
}
