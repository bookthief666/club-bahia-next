import { cn } from '@/lib/utils/cn';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-3xl border border-warmIvory/10 bg-charcoal/70 p-6 shadow-2xl backdrop-blur', className)}>{children}</div>;
}
