import 'server-only';

import { isAssetStorageConfigured } from '@/lib/admin/assets/server';

export function AssetStorageBanner() {
  const configured = isAssetStorageConfigured();

  return (
    <aside
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
        configured
          ? 'border-emerald-200/20 bg-emerald-200/8 text-emerald-50'
          : 'border-violet-200/20 bg-violet-200/8 text-violet-50'
      }`}
      aria-label="Event media storage status"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {configured
              ? 'Shared event media storage enabled'
              : 'Event media storage needs configuration'}
          </p>
          <p className="mt-1 text-xs leading-5 opacity-70">
            {configured
              ? 'Flyers, videos, audio, and PDFs upload directly from the browser to Vercel Blob. The preview access code is required before files can be listed or changed.'
              : 'Connect a public Vercel Blob store and add ADMIN_ASSET_UPLOAD_SECRET to enable secure preview uploads.'}
          </p>
        </div>
        <span className="rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">
          {configured ? 'Cloud storage' : 'Setup required'}
        </span>
      </div>
    </aside>
  );
}
