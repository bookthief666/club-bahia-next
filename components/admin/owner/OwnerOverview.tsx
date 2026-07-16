import Link from 'next/link';

const workflow = [
  {
    step: '01',
    title: 'Create the event once',
    body: 'Enter the confirmed date, time, performer, admission, age policy, reservation link, and other facts that every channel should use.',
    href: '/admin/events/new',
    action: 'Create an event',
  },
  {
    step: '02',
    title: 'Generate the promotion package',
    body: 'Prepare platform-specific captions, Stories, Reel and TikTok instructions, email, SMS, hashtags, and accessibility text from the same facts.',
    href: '/admin/events',
    action: 'Open events',
  },
  {
    step: '03',
    title: 'Reuse approved media',
    body: 'Choose proven venue photos, crowd footage, performer images, logos, and finished vertical videos without uploading the same file again.',
    href: '/admin/media',
    action: 'Open media',
  },
  {
    step: '04',
    title: 'Review everything in one inbox',
    body: 'See missing media, copy issues, safe approvals, and publishing problems across all active events before anything is scheduled.',
    href: '/admin?view=review',
    action: 'Open review inbox',
  },
  {
    step: '05',
    title: 'Follow up with real guests',
    body: 'Prioritize unanswered reservation requests, save reminders, contact guests, record outcomes, and keep confirmation language truthful.',
    href: '/admin/reservations/follow-up',
    action: 'Open guest follow-up',
  },
  {
    step: '06',
    title: 'Measure what produced turnout',
    body: 'Connect tracked campaign sources to reservation requests, confirmed guests, and recorded publishing activity for each event.',
    href: '/admin/events',
    action: 'Review event results',
  },
] as const;

const value = [
  {
    title: 'Less repeated work',
    body: 'One event record feeds the website, campaign copy, media assignments, schedule, guest follow-up, and results.',
  },
  {
    title: 'Fewer preventable mistakes',
    body: 'Deterministic checks stop placeholder copy, missing media, unconfirmed links, and unsafe bulk approvals from moving forward.',
  },
  {
    title: 'Clearer accountability',
    body: 'Every approval, media choice, reminder, queue state, and result remains attached to the correct event.',
  },
] as const;

const ready = [
  'Event planning and recurring-night templates',
  'Bilingual and platform-specific campaign generation',
  'Reusable rights-tracked media library',
  'Cross-event promotion review inbox',
  'Reservation intake, reminders, and follow-up tools',
  'Tracked campaign links and event results',
] as const;

const controlled = [
  'Social publishing stays supervised until the real Meta and TikTok accounts are connected and validated.',
  'Guest messages open in the phone or email app for review; the system does not send them automatically.',
  'Advanced crops, branded graphics, and video sequencing remain optional rather than mandatory weekly work.',
] as const;

export function OwnerOverview() {
  return (
    <div className="space-y-5 pb-24 lg:pb-10">
      <section className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_88%_6%,rgba(16,185,129,.2),transparent_25rem),radial-gradient(circle_at_10%_100%,rgba(246,183,60,.16),transparent_28rem),linear-gradient(140deg,rgba(12,18,16,.98),rgba(25,13,11,.97))] p-5 shadow-[0_30px_100px_rgba(0,0,0,.42)] sm:p-8">
        <div className="relative max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[.28em] text-emerald-200/72">
            Owner presentation
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.02] text-white sm:text-6xl">
            One operating system for planning, promoting, and measuring Club Bahia nights.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58 sm:text-base">
            The Growth OS turns confirmed event facts into coordinated promotion, reusable media, staff approvals, guest follow-up, and measurable reservation outcomes—without replacing human judgment or forcing every event through unnecessary production work.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/admin/events"
              className="inline-flex min-h-12 items-center rounded-full bg-amber-300 px-6 text-sm font-bold text-black"
            >
              Begin the walkthrough →
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-12 items-center rounded-full border border-white/14 bg-black/20 px-6 text-sm font-semibold text-white/72"
            >
              Open the public website
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {value.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.35rem] border border-white/9 bg-[linear-gradient(145deg,rgba(19,22,19,.9),rgba(17,12,10,.9))] p-5"
          >
            <h2 className="font-serif text-2xl text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/48">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.55rem] border border-white/10 bg-black/22 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-amber-100/58">
              Five-minute product walkthrough
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              Follow the real operating loop.
            </h2>
          </div>
          <p className="max-w-lg text-xs leading-5 text-white/38">
            Each step links into the working application. The walkthrough is universal and is not limited to Azucar LA or one event format.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {workflow.map((item) => (
            <article
              key={item.step}
              className="rounded-[1.25rem] border border-white/8 bg-white/[.025] p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/18 bg-amber-200/[.07] font-mono text-xs font-bold text-amber-100">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/46">{item.body}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/62 transition hover:border-amber-200/25 hover:text-amber-100"
                  >
                    {item.action} →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.45rem] border border-emerald-200/12 bg-emerald-200/[.04] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/62">
            Ready to demonstrate
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white">Operational foundation</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/55">
            {ready.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 text-emerald-200">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.45rem] border border-amber-200/12 bg-amber-200/[.04] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-amber-100/62">
            Intentionally controlled
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white">No fake automation</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/55">
            {controlled.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 text-amber-200">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/settings"
            className="mt-5 inline-flex min-h-11 items-center rounded-full border border-amber-200/18 bg-amber-200/[.06] px-5 text-xs font-bold text-amber-100"
          >
            Review production activation →
          </Link>
        </article>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.35rem] border border-white/9 bg-white/[.025] p-5">
        <div>
          <h2 className="font-serif text-2xl text-white">The presentation should end with one real event.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            After the walkthrough, choose an upcoming event and demonstrate the actual six-step workflow using confirmed Club Bahia information and approved media.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="inline-flex min-h-11 items-center rounded-full bg-emerald-200 px-5 text-sm font-bold text-black"
        >
          Choose an event →
        </Link>
      </section>
    </div>
  );
}
