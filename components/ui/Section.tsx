import { cn } from '@/lib/utils/cn';

export function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow?: string; title?: string; children: React.ReactNode; className?: string }) {
  return <section id={id} className={cn('relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24', className)}>{eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-sunsetGold">{eyebrow}</p>}{title && <h2 className="font-display text-5xl leading-none text-warmIvory sm:text-6xl">{title}</h2>}<div className={cn(title && 'mt-8')}>{children}</div></section>;
}
