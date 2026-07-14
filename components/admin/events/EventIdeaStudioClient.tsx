'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
  EventIdeaConcept,
  EventIdeaGenerationResult,
  EventIdeaGoal,
  EventIdeaInput,
} from '@/lib/admin/event-ideas/domain';
import {
  EVENT_IDEA_CONFIDENCE_LABELS,
  EVENT_IDEA_GOAL_LABELS,
} from '@/lib/admin/event-ideas/domain';
import { EventIdeaGenerationResultSchema } from '@/lib/admin/event-ideas/validation';
import { eventRepository, newEventDefaults } from '@/lib/admin/event-repository';
import type { LocalDate } from '@/lib/admin/date';

const INITIAL_FORM = {
  roughIdea: '',
  preferredDate: '',
  availableTalent: '',
  targetAudience: '',
  budgetDollars: '250',
  primaryGoal: 'attendance' as EventIdeaGoal,
  atmosphere: '',
  constraints: '',
};

function confidenceTone(confidence: EventIdeaConcept['confidence']): string {
  if (confidence === 'strong-hypothesis') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (confidence === 'worth-small-test') {
    return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
  }
  if (confidence === 'operationally-difficult') {
    return 'border-red-200/25 bg-red-300/10 text-red-100';
  }
  return 'border-white/15 bg-white/[.06] text-white/65';
}

function CompactList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2 text-sm leading-6 text-white/58">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function EventIdeaStudioClient() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState<EventIdeaGenerationResult | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [creatingId, setCreatingId] = useState('');

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function requestInput(): EventIdeaInput {
    const dollars = Number(form.budgetDollars || '0');
    if (!Number.isFinite(dollars) || dollars < 0) {
      throw new Error('Enter a valid promotional budget.');
    }

    return {
      roughIdea: form.roughIdea,
      preferredDate: form.preferredDate || undefined,
      availableTalent: form.availableTalent,
      targetAudience: form.targetAudience,
      budgetCents: Math.round(dollars * 100),
      primaryGoal: form.primaryGoal,
      atmosphere: form.atmosphere,
      constraints: form.constraints,
    };
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/events/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestInput()),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String(payload.error)
            : 'Could not develop event ideas.';
        throw new Error(message);
      }

      const parsed = EventIdeaGenerationResultSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('The event ideas returned in an unexpected format.');
      }
      setResult(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not develop event ideas.');
    } finally {
      setPending(false);
    }
  }

  async function useConcept(concept: EventIdeaConcept) {
    setCreatingId(concept.id);
    setError('');
    try {
      const defaults = newEventDefaults();
      const date = (form.preferredDate || defaults.date) as LocalDate;
      const conceptSummary = [
        concept.oneLineConcept,
        `Programming format: ${concept.programmingFormat}`,
        `Promotion angle: ${concept.promotionAngle}`,
        `First test: ${concept.lowCostTest}`,
      ]
        .join('\n\n')
        .slice(0, 1200);

      const saved = await eventRepository.createEvent({
        ...defaults,
        title: concept.title,
        concept: conceptSummary,
        date,
        status: 'evaluating',
        riskFlags: concept.risks,
      });

      router.push(`/admin/events/${saved.id}/edit?from=idea-studio`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the event draft.');
      setCreatingId('');
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_90%_8%,rgba(246,183,60,.22),transparent_24rem),radial-gradient(circle_at_7%_95%,rgba(18,120,106,.25),transparent_26rem),linear-gradient(135deg,rgba(13,19,17,.98),rgba(28,14,13,.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.42)] sm:p-7">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/70">
            AI Event Idea Studio
          </p>
          <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
            Turn a rough idea into a night worth testing.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
            Describe the idea in ordinary language. The studio will develop three different operating concepts, expose the risks and unknowns, and create an editable event draft from the plan you choose.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/48">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">No invented profitability</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Three distinct approaches</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Human approval required</span>
          </div>
        </div>
      </section>

      <form onSubmit={generate} className="rounded-[1.5rem] border border-white/10 bg-[#12110f]/88 p-4 shadow-[0_20px_60px_rgba(0,0,0,.28)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-amber-100/60">Start here</p>
            <h2 className="mt-1 font-serif text-3xl text-white">Describe the opportunity</h2>
          </div>
          <Link href="/admin/events/new" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-white/25 hover:text-white">
            Enter confirmed event manually
          </Link>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-red-200/15 bg-red-400/10 p-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm lg:col-span-2">
            Rough event idea
            <textarea
              required
              rows={4}
              placeholder="Example: an 80s darkwave Thursday with local DJs, dramatic lighting, and a welcoming alternative crowd"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 p-4 leading-6 outline-none transition focus:border-amber-200/40 focus:ring-2 focus:ring-amber-200/10"
              value={form.roughIdea}
              onChange={(event) => update('roughIdea', event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Preferred date <span className="text-white/35">(optional)</span>
            <input
              type="date"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3"
              value={form.preferredDate}
              onChange={(event) => update('preferredDate', event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Main goal
            <select
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3"
              value={form.primaryGoal}
              onChange={(event) => update('primaryGoal', event.target.value as EventIdeaGoal)}
            >
              {Object.entries(EVENT_IDEA_GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-black">
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            DJs, bands, hosts, or promoters available
            <input
              placeholder="Names, roles, or leave blank"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3"
              value={form.availableTalent}
              onChange={(event) => update('availableTalent', event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Audience you hope to attract
            <input
              placeholder="Example: alternative nightlife regulars in Echo Park and nearby neighborhoods"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3"
              value={form.targetAudience}
              onChange={(event) => update('targetAudience', event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Promotional budget
            <div className="mt-1 flex min-h-12 items-center rounded-xl border border-white/10 bg-black/25 px-3">
              <span className="text-white/40">$</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent px-2 outline-none"
                value={form.budgetDollars}
                onChange={(event) => update('budgetDollars', event.target.value)}
              />
            </div>
          </label>

          <label className="block text-sm">
            Desired atmosphere
            <input
              placeholder="Example: nocturnal, cinematic, warm, energetic"
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3"
              value={form.atmosphere}
              onChange={(event) => update('atmosphere', event.target.value)}
            />
          </label>

          <label className="block text-sm lg:col-span-2">
            Constraints or concerns
            <textarea
              rows={3}
              placeholder="Example: limited staff, Thursday attendance uncertainty, performer budget, noise cutoff, or no original footage yet"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 p-4 leading-6"
              value={form.constraints}
              onChange={(event) => update('constraints', event.target.value)}
            />
          </label>
        </div>

        <button
          disabled={pending}
          className="mt-5 min-h-12 w-full rounded-full bg-amber-300 px-6 text-sm font-bold text-black shadow-[0_14px_38px_rgba(246,183,60,.16)] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {pending ? 'Developing three concepts…' : 'Develop three event concepts →'}
        </button>
      </form>

      {result ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-200/60">Compare before committing</p>
              <h2 className="mt-1 font-serif text-3xl text-white">Three ways to build the night</h2>
            </div>
            <div className="text-right text-xs text-white/42">
              <p>{result.provider === 'openai' ? 'Developed with live AI' : 'Developed with starter logic'}</p>
              {result.model ? <p className="mt-1">Model: {result.model}</p> : null}
            </div>
          </div>

          {result.warning ? (
            <p className="rounded-2xl border border-amber-200/15 bg-amber-200/[.06] p-3 text-sm leading-6 text-amber-100/75">
              {result.warning}
            </p>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-3">
            {result.concepts.map((concept, index) => (
              <article key={concept.id} className="flex flex-col rounded-[1.5rem] border border-white/10 bg-[linear-gradient(155deg,rgba(19,19,17,.96),rgba(18,11,10,.94))] p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/10 text-sm font-bold text-amber-100">
                    {index + 1}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${confidenceTone(concept.confidence)}`}>
                    {EVENT_IDEA_CONFIDENCE_LABELS[concept.confidence]}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-3xl text-white">{concept.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{concept.oneLineConcept}</p>

                <div className="mt-4 space-y-3 rounded-2xl border border-white/8 bg-black/18 p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.16em] text-white/35">Who it is for</p>
                    <p className="mt-1 text-sm leading-6 text-white/64">{concept.intendedAudience}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[.16em] text-white/35">Format</p>
                    <p className="mt-1 text-sm leading-6 text-white/64">{concept.programmingFormat}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[.16em] text-white/35">Promotion angle</p>
                    <p className="mt-1 text-sm leading-6 text-white/64">{concept.promotionAngle}</p>
                  </div>
                </div>

                <details className="mt-4 rounded-2xl border border-white/8 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-white/78">Timing and first test</summary>
                  <p className="mt-3 text-sm leading-6 text-white/58">{concept.recommendedTiming}</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{concept.suggestedCadence}</p>
                  <p className="mt-3 rounded-xl bg-emerald-200/[.06] p-3 text-sm leading-6 text-emerald-50/72">{concept.lowCostTest}</p>
                </details>

                <details className="mt-3 rounded-2xl border border-white/8 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-white/78">People and setup needed</summary>
                  <CompactList items={[...concept.talentRequirements, ...concept.operationalRequirements]} />
                </details>

                <details className="mt-3 rounded-2xl border border-white/8 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-white/78">Risks and unanswered questions</summary>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.16em] text-red-100/55">Risks</p>
                  <CompactList items={concept.risks} />
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-amber-100/55">Still need to know</p>
                  <CompactList items={concept.openQuestions} />
                </details>

                <p className="mt-4 text-sm leading-6 text-white/48">{concept.fitRationale}</p>

                <button
                  type="button"
                  disabled={Boolean(creatingId)}
                  onClick={() => useConcept(concept)}
                  className="mt-5 min-h-12 w-full rounded-full bg-emerald-300 px-5 text-sm font-bold text-black disabled:opacity-55"
                >
                  {creatingId === concept.id ? 'Creating event draft…' : 'Use this plan →'}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
