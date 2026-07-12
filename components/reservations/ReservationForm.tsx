'use client';

import { useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { PublicEventCard } from '@/lib/public-events/domain';
import type { ReservationReceipt } from '@/lib/reservations/domain';
import {
  createReservationSchema,
  type ReservationFormInput,
  type ReservationFormValues,
} from '@/lib/reservations/reservation-schema';
import { fieldClassName, ReservationField } from './ReservationField';
import { ReservationSuccess } from './ReservationSuccess';

function eventDateFromStart(startsAt?: string): string | undefined {
  if (!startsAt) return undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startsAt));
}

function displayDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function ReservationForm({ event }: { event?: PublicEventCard | null }) {
  const eventDate = eventDateFromStart(event?.startsAt);
  const schema = useMemo(() => createReservationSchema(eventDate), [eventDate]);
  const startedAt = useRef(Date.now());
  const [website, setWebsite] = useState('');
  const [receipt, setReceipt] = useState<ReservationReceipt>();
  const [submittedValues, setSubmittedValues] = useState<ReservationFormValues>();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const defaultValues: ReservationFormInput = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    date: eventDate ?? '',
    guests: 2,
    occasion: event?.title ? `Attending ${event.title}` : '',
    note: '',
    consent: false,
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReservationFormInput, unknown, ReservationFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const guests = watch('guests');

  async function onSubmit(values: ReservationFormValues) {
    setSubmitting(true);
    setServerError('');

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          eventId: event?.id ?? '',
          eventSlug: event?.slug ?? '',
          eventTitle: event?.title ?? '',
          website,
          startedAt: startedAt.current,
        }),
      });
      const result = (await response.json()) as {
        receipt?: ReservationReceipt;
        error?: string;
      };
      if (!response.ok || !result.receipt) {
        throw new Error(
          result.error ||
            'The request could not be sent. Please call Club Bahia for assistance.',
        );
      }

      setSubmittedValues(values);
      setReceipt(result.receipt);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'The request could not be sent. Please call Club Bahia for assistance.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startAnotherRequest() {
    setReceipt(undefined);
    setSubmittedValues(undefined);
    setServerError('');
    setWebsite('');
    startedAt.current = Date.now();
    reset(defaultValues);
  }

  if (receipt && submittedValues) {
    return (
      <ReservationSuccess
        values={submittedValues}
        receipt={receipt}
        onNewRequest={startAnotherRequest}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[1.55rem] border border-amber-100/15 bg-[#100606]/90 p-3 shadow-[0_0_70px_rgba(225,18,27,0.16)] sm:rounded-[2rem] sm:p-6 lg:p-8"
      noValidate
    >
      <div className="rounded-[1.2rem] border border-dashed border-amber-200/20 bg-gradient-to-br from-amber-200/[0.07] via-transparent to-red-600/[0.08] p-3 sm:rounded-[1.5rem] sm:border-amber-200/25 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-dotted border-amber-100/20 pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
          <div>
            <p className="text-[0.66rem] uppercase tracking-[0.24em] text-red-200 sm:text-xs sm:tracking-[0.28em]">
              Club Bahia Reservation Request
            </p>
            <h2 className="mt-1.5 font-serif text-[2rem] leading-none tracking-[-0.04em] text-amber-50 sm:mt-2 sm:text-5xl">
              Tell Us About Your Night
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[0.64rem] uppercase tracking-[0.16em] text-amber-100/65 sm:justify-end sm:text-sm sm:tracking-[0.18em]">
            <span className="rounded-full border border-amber-100/15 px-2.5 py-1">21+</span>
            <span className="rounded-full border border-red-300/25 bg-red-600/10 px-2.5 py-1 text-amber-100">
              Request · Not confirmation
            </span>
          </div>
        </div>

        {event ? (
          <div
            className="mt-4 rounded-2xl border border-emerald-200/18 bg-emerald-200/[0.06] p-4 text-sm leading-6 text-amber-50/80"
            role="note"
          >
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-emerald-200/70">
              Event selected
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-50">{event.title}</p>
            <p className="mt-1 text-amber-50/65">
              {event.dateLabel} · {event.timeLabel}
              {event.room ? ` · ${event.room}` : ''}
            </p>
          </div>
        ) : null}

        <div className="my-4 border-t border-dotted border-amber-100/20 sm:my-5" aria-hidden="true" />

        <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(input) => setWebsite(input.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <ReservationField id="firstName" label="First name" error={errors.firstName?.message}>
            <input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              className={fieldClassName}
              {...register('firstName')}
            />
          </ReservationField>

          <ReservationField id="lastName" label="Last name" error={errors.lastName?.message}>
            <input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              className={fieldClassName}
              {...register('lastName')}
            />
          </ReservationField>

          <ReservationField
            id="phone"
            label="Phone number"
            error={errors.phone?.message}
            help="The venue may call or text about this request."
          >
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(213) 555-0123"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-help'}
              className={fieldClassName}
              {...register('phone')}
            />
          </ReservationField>

          <ReservationField id="email" label="Email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={fieldClassName}
              {...register('email')}
            />
          </ReservationField>

          {eventDate ? (
            <ReservationField
              id="date"
              label="Event date"
              error={errors.date?.message}
              help="This date comes from the selected event."
            >
              <input type="hidden" {...register('date')} />
              <div className="flex min-h-12 items-center rounded-xl border border-emerald-200/18 bg-emerald-200/[0.05] px-3 text-amber-50">
                {displayDate(eventDate)}
              </div>
            </ReservationField>
          ) : (
            <ReservationField
              id="date"
              label="Date of reservation"
              error={errors.date?.message}
              help="General reservations are Friday and Saturday nights."
            >
              <input
                id="date"
                type="date"
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'date-error' : 'date-help'}
                className={`${fieldClassName} appearance-none text-amber-50 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:invert`}
                {...register('date')}
              />
            </ReservationField>
          )}

          <ReservationField id="guests" label="Number of guests" error={errors.guests?.message}>
            <select
              id="guests"
              aria-invalid={!!errors.guests}
              aria-describedby={
                errors.guests
                  ? 'guests-error'
                  : Number(guests) >= 5
                    ? 'guests-notice'
                    : undefined
              }
              className={fieldClassName}
              {...register('guests', { valueAsNumber: true })}
            >
              {Array.from({ length: 30 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
            {Number(guests) >= 5 ? (
              <p id="guests-notice" className="text-sm leading-6 text-amber-200">
                Groups of 5 or more may require phone confirmation or a deposit.
              </p>
            ) : null}
          </ReservationField>

          <ReservationField
            id="occasion"
            label="Occasion"
            error={errors.occasion?.message}
            className="sm:col-span-2"
          >
            <input
              id="occasion"
              placeholder="Birthday, anniversary, date night, group night…"
              aria-invalid={!!errors.occasion}
              aria-describedby={errors.occasion ? 'occasion-error' : undefined}
              className={fieldClassName}
              {...register('occasion')}
            />
          </ReservationField>

          <ReservationField
            id="note"
            label="Anything else we should know?"
            error={errors.note?.message}
            className="sm:col-span-2"
          >
            <textarea
              id="note"
              rows={4}
              placeholder="Preferred arrival time, accessibility needs, celebration details, or table questions…"
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? 'note-error' : undefined}
              className={fieldClassName}
              {...register('note')}
            />
          </ReservationField>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200/15 bg-black/20 p-4 sm:mt-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-amber-50/72">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-red-600"
              aria-invalid={!!errors.consent}
              {...register('consent')}
            />
            <span>
              I agree that Club Bahia may contact me by phone, text, or email about this reservation request. Standard messaging rates may apply.
            </span>
          </label>
          {errors.consent ? (
            <p className="mt-2 text-sm text-red-200">{errors.consent.message}</p>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-red-300/25 bg-red-950/20 p-3 text-sm leading-6 text-amber-50/75 sm:mt-6 sm:p-4">
          <p className="font-semibold text-amber-50">Before you send:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>A request does not guarantee admission, a table, or a specific seating area.</li>
            <li>Valid 21+ identification is required unless an event explicitly states otherwise.</li>
            <li>Large groups may require direct confirmation or a deposit.</li>
            <li>For urgent or same-day requests, call (213) 250-4313.</li>
          </ul>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-300/30 bg-red-950/35 p-4 text-sm leading-6 text-red-50"
          >
            <p className="font-semibold">The request was not sent.</p>
            <p className="mt-1">{serverError}</p>
            <a
              href="tel:2132504313"
              className="mt-3 inline-flex min-h-10 items-center rounded-full border border-red-200/25 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-100"
            >
              Call Club Bahia
            </a>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 min-h-12 w-full rounded-full bg-red-600 px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_36px_rgba(225,18,27,0.35)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-wait disabled:opacity-55 sm:mt-6 sm:px-6 sm:py-4 sm:tracking-[0.2em]"
        >
          {submitting ? 'Sending Request…' : 'Send Reservation Request'}
        </button>
      </div>
    </form>
  );
}
