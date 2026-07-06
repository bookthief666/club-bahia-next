'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const reservationSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
});

type ReservationForm = z.infer<typeof reservationSchema>;

export function ReservationCTASection() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservationForm>({ resolver: zodResolver(reservationSchema) });

  const callVenue = () => {
    window.location.assign('tel:+12132504313');
  };

  return (
    <Section id="reservations" eyebrow="Reservations" title="Plan Your Night">
      <Card className="border-bahiaRed/20 bg-[radial-gradient(circle_at_10%_0%,rgba(225,18,27,.18),transparent_34%),linear-gradient(135deg,rgba(23,21,26,.78),rgba(5,3,4,.72))]">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-lg font-semibold text-warmIvory">Start the evening with a quick call.</p>
            <p className="mt-3 text-sm leading-7 text-mutedSand sm:text-base">
              Reservation intake is coming next. For now, leave your details here and tap the call button for confirmation with the venue.
            </p>
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(callVenue)}>
            <label className="text-sm font-bold text-warmIvory">
              Name
              <input
                className="mt-2 w-full rounded-2xl border border-warmIvory/15 bg-bahiaBlack/75 px-4 py-3 text-warmIvory outline-none transition placeholder:text-softGray/60 focus:border-amberGlow focus:ring-2 focus:ring-amberGlow/40"
                autoComplete="name"
                {...register('name')}
              />
            </label>
            <label className="text-sm font-bold text-warmIvory">
              Phone
              <input
                className="mt-2 w-full rounded-2xl border border-warmIvory/15 bg-bahiaBlack/75 px-4 py-3 text-warmIvory outline-none transition placeholder:text-softGray/60 focus:border-amberGlow focus:ring-2 focus:ring-amberGlow/40"
                autoComplete="tel"
                {...register('phone')}
              />
            </label>
            <div className="sm:col-span-2">
              {(errors.name || errors.phone) && (
                <p className="mb-3 text-sm text-amberGlow">Please enter a name and phone number.</p>
              )}
              <Button className="w-full sm:w-auto">Make a Reservation</Button>
            </div>
          </form>
        </div>
      </Card>
    </Section>
  );
}
