import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
};

const variants = {
  primary:
    'border border-bahiaRed/80 bg-bahiaRed text-warmIvory shadow-[0_0_26px_rgba(225,18,27,.34),inset_0_1px_0_rgba(255,255,255,.18)] hover:bg-bahiaRedDark hover:shadow-[0_0_42px_rgba(225,18,27,.5)]',
  secondary:
    'border border-sunsetGold/60 bg-bahiaBlack/35 text-warmIvory shadow-[inset_0_1px_0_rgba(255,255,255,.08)] hover:border-amberGlow hover:bg-sunsetGold/95 hover:text-bahiaBlack hover:shadow-gold',
  ghost: 'text-mutedSand hover:bg-warmIvory/10 hover:text-warmIvory',
};

export function Button({ href, children, variant = 'primary', className }: ButtonProps) {
  const classes = cn(
    'inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-center text-[0.8rem] font-black uppercase tracking-[0.16em] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amberGlow active:translate-y-0',
    variants[variant],
    className,
  );
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button className={classes}>{children}</button>;
}
