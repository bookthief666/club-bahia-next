import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
};

const variants = {
  primary: 'bg-bahiaRed text-warmIvory shadow-glow hover:bg-bahiaRedDark hover:shadow-[0_0_42px_rgba(225,18,27,.48)]',
  secondary: 'border border-sunsetGold/70 text-warmIvory hover:bg-sunsetGold hover:text-bahiaBlack hover:shadow-gold',
  ghost: 'text-mutedSand hover:text-warmIvory hover:bg-warmIvory/10',
};

export function Button({ href, children, variant = 'primary', className }: ButtonProps) {
  const classes = cn('inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] transition duration-200 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amberGlow', variants[variant], className);
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button className={classes}>{children}</button>;
}
