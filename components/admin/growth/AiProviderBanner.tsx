import 'server-only';

export function AiProviderBanner() {
  const configured = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_CAMPAIGN_MODEL || 'gpt-5.6';

  return (
    <aside
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
        configured
          ? 'border-emerald-200/20 bg-emerald-200/8 text-emerald-50'
          : 'border-violet-200/20 bg-violet-200/8 text-violet-50'
      }`}
      aria-label="Campaign AI provider status"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {configured ? 'Real AI campaign generation enabled' : 'Fixture campaign generation active'}
          </p>
          <p className="mt-1 text-xs opacity-70">
            {configured
              ? `Server-side OpenAI model: ${model}. Deterministic fallback remains available if a request fails.`
              : 'Add OPENAI_API_KEY to this Vercel deployment to enable professional AI copy. No secret is exposed to the browser.'}
          </p>
        </div>
        <span className="rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">
          {configured ? 'OpenAI' : 'Fixture AI'}
        </span>
      </div>
    </aside>
  );
}
