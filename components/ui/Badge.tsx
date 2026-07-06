import { cn } from '@/lib/utils/cn';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex rounded-full border border-sunsetGold/30 bg-sunsetGold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amberGlow', className)}>{children}</span>;
}
