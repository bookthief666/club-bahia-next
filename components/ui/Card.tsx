import { cn } from '@/lib/utils/cn';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-[1.75rem] border border-warmIvory/10 bg-charcoal/62 p-5 shadow-[0_24px_80px_rgba(0,0,0,.34),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md sm:p-6', className)}>{children}</div>;
}
