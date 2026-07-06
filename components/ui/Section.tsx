import { cn } from '@/lib/utils/cn';

export function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20', className)}>
      {eyebrow && <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.34em] text-sunsetGold">{eyebrow}</p>}
      {title && <h2 className="max-w-4xl font-display text-[clamp(2.55rem,10vw,4.7rem)] leading-[0.94] tracking-wide text-warmIvory">{title}</h2>}
      <div className={cn(title && 'mt-6 sm:mt-8')}>{children}</div>
    </section>
  );
}
