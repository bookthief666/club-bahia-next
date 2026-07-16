'use client';

import Link from 'next/link';
import {
  type ReservationStatus,
  type StoredReservation,
  reservationGuestName,
} from '@/lib/reservations/domain';
import {
  classifyReservationFollowUp,
  followUpAtForPreset,
  type ReservationFollowUpPreset,
  type ReservationFollowUpPriority,
} from '@/lib/reservations/follow-up';
import {
  reservationEmailSubject,
  reservationMessage,
  type ReservationMessageKind,
} from '@/lib/reservations/messages';

function displayReservationDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function displayVenueDateTime(value?: string): string {
  if (!value) return 'Not scheduled';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function priorityTone(priority: ReservationFollowUpPriority): string {
  if (priority === 'urgent') {
    return 'border-red-200/25 bg-red-200/10 text-red-100';
  }
  if (priority === 'high') {
    return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
  }
  if (priority === 'normal') {
    return 'border-sky-200/20 bg-sky-200/[.07] text-sky-100';
  }
  return 'border-white/12 bg-white/[.04] text-white/52';
}

function messageKind(reservation: StoredReservation): ReservationMessageKind {
  if (reservation.status === 'new') return 'received';
  if (reservation.status === 'confirmed') return 'confirmed';
  if (reservation.status === 'waitlist') return 'waitlist';
  return 'change-request';
}

export function ReservationFollowUpCard({
  reservation,
  now,
  pending,
  onUpdate,
}: {
  reservation: StoredReservation;
  now: Date;
  pending: boolean;
  onUpdate: (
    patch: {
      status?: ReservationStatus;
      followUpAt?: string | null;
    },
    successMessage: string,
  ) => Promise<void>;
}) {
  const state = classifyReservationFollowUp(reservation, now);
  const kind = messageKind(reservation);
  const smsHref = `sms:${reservation.phone}?body=${encodeURIComponent(
    reservationMessage(reservation, kind),
  )}`;
  const emailHref = `mailto:${reservation.email}?subject=${encodeURIComponent(
    reservationEmailSubject(reservation, kind),
  )}&body=${encodeURIComponent(reservationMessage(reservation, kind))}`;
  const canScheduleReminder = !['confirmed', 'cancelled', 'completed'].includes(
    reservation.status,
  );
  const canUseDayBefore = state.daysUntilEvent > 1;

  async function scheduleReminder(
    preset: ReservationFollowUpPreset,
    label: string,
  ) {
    const followUpAt = followUpAtForPreset({
      preset,
      reservation,
      now,
    });
    const successMessage =
      reservation.status === 'new'
        ? `${reservationGuestName(reservation)} marked contacted with a ${label.toLowerCase()} reminder.`
        : `${label} reminder saved for ${reservationGuestName(reservation)}.`;
    await onUpdate(
      {
        status: reservation.status === 'new' ? 'contacted' : reservation.status,
        followUpAt,
      },
      successMessage,
    );
  }

  return (
    <article className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,19,16,.94),rgba(18,14,12,.96))] p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-100/58">
            {reservation.eventTitle || 'General reservation'} ·{' '}
            {displayReservationDate(reservation.date)}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {reservationGuestName(reservation)} · {reservation.guests} guests
          </h2>
          <p className="mt-1 text-xs text-white/42">
            Request {reservation.id} · status {reservation.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${priorityTone(
              state.priority,
            )}`}
          >
            {state.label}
          </span>
          {reservation.followUpAt ? (
            <span className="rounded-full border border-sky-200/16 bg-sky-200/[.06] px-3 py-1 text-[9px] font-semibold uppercase tracking-[.1em] text-sky-100">
              {displayVenueDateTime(reservation.followUpAt)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/9 bg-black/20 p-3">
        <p className="text-sm leading-6 text-white/62">{state.detail}</p>
        {reservation.staffNote ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/38">
            Staff note: {reservation.staffNote}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <a
          href={`tel:${reservation.phone}`}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-300 px-3 text-xs font-bold text-black"
        >
          Call
        </a>
        <a
          href={smsHref}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-sky-200/18 bg-sky-200/[.06] px-3 text-xs font-semibold text-sky-100"
        >
          Text
        </a>
        <a
          href={emailHref}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-3 text-xs font-semibold text-white/68"
        >
          Email
        </a>
      </div>

      {canScheduleReminder ? (
        <section className="mt-4 rounded-xl border border-sky-200/12 bg-sky-200/[.035] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-sky-100/55">
            Save next follow-up
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void scheduleReminder('two-hours', '2-hour')}
              className="min-h-10 rounded-full border border-sky-200/18 px-4 text-xs font-semibold text-sky-100 disabled:opacity-40"
            >
              {reservation.status === 'new' ? 'Contacted · 2 hours' : 'In 2 hours'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void scheduleReminder('tomorrow', 'Tomorrow')}
              className="min-h-10 rounded-full border border-sky-200/18 px-4 text-xs font-semibold text-sky-100 disabled:opacity-40"
            >
              {reservation.status === 'new'
                ? 'Contacted · tomorrow'
                : 'Tomorrow 11 AM'}
            </button>
            {canUseDayBefore ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void scheduleReminder('day-before-event', 'Day-before-event')
                }
                className="min-h-10 rounded-full border border-sky-200/18 px-4 text-xs font-semibold text-sky-100 disabled:opacity-40"
              >
                Day before event
              </button>
            ) : null}
            {reservation.followUpAt ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void onUpdate(
                    { followUpAt: null },
                    `Follow-up reminder cleared for ${reservationGuestName(
                      reservation,
                    )}.`,
                  )
                }
                className="min-h-10 rounded-full border border-white/10 px-4 text-xs font-semibold text-white/50 disabled:opacity-40"
              >
                Clear reminder
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
        {reservation.status !== 'confirmed' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void onUpdate(
                { status: 'confirmed', followUpAt: null },
                `${reservationGuestName(reservation)} marked confirmed.`,
              )
            }
            className="min-h-10 rounded-full border border-emerald-200/22 bg-emerald-200/[.07] px-4 text-xs font-semibold text-emerald-100 disabled:opacity-40"
          >
            Confirm
          </button>
        ) : null}
        {!['waitlist', 'confirmed', 'cancelled', 'completed'].includes(
          reservation.status,
        ) ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void onUpdate(
                { status: 'waitlist' },
                `${reservationGuestName(reservation)} moved to the waitlist.`,
              )
            }
            className="min-h-10 rounded-full border border-amber-200/20 bg-amber-200/[.06] px-4 text-xs font-semibold text-amber-100 disabled:opacity-40"
          >
            Waitlist
          </button>
        ) : null}
        {reservation.status === 'confirmed' && state.daysUntilEvent < 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void onUpdate(
                { status: 'completed', followUpAt: null },
                `${reservationGuestName(reservation)} marked completed.`,
              )
            }
            className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/60 disabled:opacity-40"
          >
            Mark completed
          </button>
        ) : null}
        {!['cancelled', 'completed'].includes(reservation.status) ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void onUpdate(
                { status: 'cancelled', followUpAt: null },
                `${reservationGuestName(reservation)} marked cancelled.`,
              )
            }
            className="min-h-10 rounded-full border border-red-200/18 bg-red-200/[.05] px-4 text-xs font-semibold text-red-100 disabled:opacity-40"
          >
            Cancel
          </button>
        ) : null}
        <Link
          href="/admin/reservations"
          className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/55"
        >
          Full details and notes
        </Link>
      </div>
    </article>
  );
}
