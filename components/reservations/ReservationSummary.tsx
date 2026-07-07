import type { ReservationFormValues } from '@/lib/reservations/reservation-schema';

const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function displayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return formatter.format(new Date(Date.UTC(year, month - 1, day)));
}

export function ReservationSummary({ values }: { values: ReservationFormValues }) {
  const rows = [
    ['Name', `${values.firstName} ${values.lastName}`],
    ['Phone', values.phone],
    ['Email', values.email],
    ['Date', displayDate(values.date)],
    ['Guests', String(values.guests)],
    ['Occasion', values.occasion || 'Not specified'],
    ['Note', values.note || 'No note added'],
  ];

  return (
    <dl className="grid gap-3 rounded-[1.75rem] border border-amber-100/15 bg-black/30 p-4 sm:p-5">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 border-b border-amber-100/10 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-amber-200/65">{label}</dt>
          <dd className="text-sm leading-6 text-amber-50 sm:text-base">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
