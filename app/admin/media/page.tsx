import { MediaDerivativeWorkspaceClient } from '@/components/admin/assets/MediaDerivativeWorkspaceClient';
import { MediaLibraryClient } from '@/components/admin/assets/MediaLibraryClient';

export const dynamic = 'force-dynamic';

export default function AdminMediaLibraryPage() {
  return (
    <div className="space-y-5">
      <MediaLibraryClient />

      <details className="group rounded-[1.45rem] border border-white/9 bg-white/[.025] p-4 sm:p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/38">
                Advanced production tools
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white/82">
                Custom crops and branded graphics
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Open this only when the recommended original is not already ready for the platform. Most recurring campaigns can reuse approved library media without creating another version.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/48 group-open:text-amber-100">
              <span className="group-open:hidden">Open tools</span>
              <span className="hidden group-open:inline">Close tools</span>
            </span>
          </div>
        </summary>
        <div className="mt-5 border-t border-white/8 pt-5">
          <MediaDerivativeWorkspaceClient />
        </div>
      </details>
    </div>
  );
}
