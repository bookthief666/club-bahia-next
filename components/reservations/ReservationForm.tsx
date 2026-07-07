'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { reservationSchema, type ReservationFormInput, type ReservationFormValues } from '@/lib/reservations/reservation-schema';
import { fieldClassName, ReservationField } from './ReservationField';
import { ReservationSuccess } from './ReservationSuccess';

const defaultValues: ReservationFormInput = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  date: '',
  guests: 2,
  occasion: '',
  note: '',
};

export function ReservationForm() {
  const [readyRequest, setReadyRequest] = useState<ReservationFormValues | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReservationFormInput, unknown, ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues,
    mode: 'onBlur',
  });
  const guests = watch('guests');

  function onSubmit(values: ReservationFormValues) {
    // TODO: connect to server action / Supabase / email provider after UI approval.
    setReadyRequest(values);
  }

  if (readyRequest) {
    return <ReservationSuccess values={readyRequest} onEdit={() => setReadyRequest(null)} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[2rem] border border-amber-100/15 bg-[#100606]/90 p-4 shadow-[0_0_70px_rgba(225,18,27,0.16)] sm:p-6 lg:p-8" noValidate>
      <div className="rounded-[1.5rem] border border-dashed border-amber-200/25 bg-gradient-to-br from-amber-200/[0.07] via-transparent to-red-600/[0.08] p-4 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-amber-100/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-red-200">Nightlife Invitation</p>
            <h2 className="mt-2 font-serif text-3xl leading-none tracking-[-0.04em] text-amber-50 sm:text-5xl">Request Details</h2>
          </div>
          <p className="text-sm uppercase tracking-[0.18em] text-amber-100/60">Fri · Sat</p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <ReservationField id="firstName" label="First name" error={errors.firstName?.message}>
            <input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-error' : undefined} className={fieldClassName} {...register('firstName')} />
          </ReservationField>
          <ReservationField id="lastName" label="Last name" error={errors.lastName?.message}>
            <input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-error' : undefined} className={fieldClassName} {...register('lastName')} />
          </ReservationField>
          <ReservationField id="phone" label="Phone number" error={errors.phone?.message} help="US phone number preferred.">
            <input id="phone" type="tel" autoComplete="tel" placeholder="(213) 250-4313" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : 'phone-help'} className={fieldClassName} {...register('phone')} />
          </ReservationField>
          <ReservationField id="email" label="Email" error={errors.email?.message}>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} className={fieldClassName} {...register('email')} />
          </ReservationField>
          <ReservationField id="date" label="Date of reservation" error={errors.date?.message} help="Reservations are currently Friday and Saturday nights only.">
            <input id="date" type="date" aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : 'date-help'} className={fieldClassName} {...register('date')} />
          </ReservationField>
          <ReservationField id="guests" label="Number of guests" error={errors.guests?.message}>
            <select id="guests" aria-invalid={!!errors.guests} aria-describedby={errors.guests ? 'guests-error' : Number(guests) >= 5 ? 'guests-notice' : undefined} className={fieldClassName} {...register('guests', { valueAsNumber: true })}>
              {Array.from({ length: 30 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
            {Number(guests) >= 5 && <p id="guests-notice" className="text-sm leading-6 text-amber-200">Groups of 5 or more may require phone confirmation.</p>}
          </ReservationField>
          <ReservationField id="occasion" label="Occasion / event type" error={errors.occasion?.message} className="sm:col-span-2">
            <input id="occasion" placeholder="Birthday, anniversary, group night..." aria-invalid={!!errors.occasion} aria-describedby={errors.occasion ? 'occasion-error' : undefined} className={fieldClassName} {...register('occasion')} />
          </ReservationField>
          <ReservationField id="note" label="Optional note" error={errors.note?.message} className="sm:col-span-2">
            <textarea id="note" rows={5} placeholder="Anything the door or reservation team should know?" aria-invalid={!!errors.note} aria-describedby={errors.note ? 'note-error' : undefined} className={fieldClassName} {...register('note')} />
          </ReservationField>
        </div>

        <div className="mt-6 rounded-2xl border border-red-300/25 bg-red-950/20 p-4 text-sm leading-6 text-amber-50/75">
          <p className="font-semibold text-amber-50">Before you request:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Reservations are Friday and Saturday nights only.</li>
            <li>21+ ID required.</li>
            <li>Dress code enforced.</li>
            <li>Phone confirmation may be required for groups of 5 or more.</li>
          </ul>
        </div>

        <button type="submit" className="mt-6 min-h-12 w-full rounded-full bg-red-600 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_36px_rgba(225,18,27,0.35)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400">
          Review Reservation Request
        </button>
      </div>
    </form>
  );
}
