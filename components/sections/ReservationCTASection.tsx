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
      <Card>
        <p className="text-mutedSand">
          Reservation intake is coming next. For now, start here and call the venue for confirmation.
        </p>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(callVenue)}>
          <label className="text-sm font-bold text-warmIvory">
            Name
            <input
              className="mt-2 w-full rounded-2xl border border-warmIvory/15 bg-bahiaBlack px-4 py-3 text-warmIvory focus:outline-none focus:ring-2 focus:ring-amberGlow"
              {...register('name')}
            />
          </label>
          <label className="text-sm font-bold text-warmIvory">
            Phone
            <input
              className="mt-2 w-full rounded-2xl border border-warmIvory/15 bg-bahiaBlack px-4 py-3 text-warmIvory focus:outline-none focus:ring-2 focus:ring-amberGlow"
              {...register('phone')}
            />
          </label>
          <div className="sm:col-span-2">
            {(errors.name || errors.phone) && (
              <p className="mb-3 text-sm text-amberGlow">Please enter a name and phone number.</p>
            )}
            <Button>Make a Reservation</Button>
          </div>
        </form>
      </Card>
    </Section>
  );
}
