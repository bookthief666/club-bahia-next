import { cn } from '@/lib/utils/cn';

type ReservationFieldProps = {
  id: string;
  label: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
  className?: string;
};

export function ReservationField({ id, label, error, help, children, className }: ReservationFieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('grid gap-2', className)}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
        {label}
      </label>
      {children}
      {help && !error && <p id={helpId} className="text-sm leading-6 text-amber-50/60">{help}</p>}
      {error && <p id={errorId} className="text-sm leading-6 text-red-200">{error}</p>}
    </div>
  );
}

export const fieldClassName = 'min-h-12 w-full rounded-xl border border-amber-100/15 bg-black/35 px-3.5 py-3 text-base text-amber-50 shadow-inner shadow-black/30 outline-none transition placeholder:text-amber-100/35 focus:border-red-300 focus:ring-2 focus:ring-red-500/70 sm:rounded-2xl sm:px-4';
