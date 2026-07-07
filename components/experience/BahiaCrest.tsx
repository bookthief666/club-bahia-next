import type { SVGProps } from 'react';

type BahiaCrestProps = SVGProps<SVGSVGElement> & {
  compact?: boolean;
  title?: string;
};

export function BahiaCrest({ compact = false, title, className = '', ...props }: BahiaCrestProps) {
  const titleId = title ? 'bahia-crest-title' : undefined;

  return (
    <svg
      viewBox="0 0 220 260"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={titleId}
      className={`bahia-crest ${compact ? 'bahia-crest--mini' : ''} ${className}`.trim()}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <defs>
        <radialGradient id="bahiaSun" cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#fff6e8" />
          <stop offset="34%" stopColor="#f6b73c" />
          <stop offset="67%" stopColor="#e1121b" />
          <stop offset="100%" stopColor="#4d070b" />
        </radialGradient>
        <linearGradient id="bahiaFrame" x1="28" y1="20" x2="196" y2="238">
          <stop offset="0%" stopColor="#fff6e8" stopOpacity="0.88" />
          <stop offset="32%" stopColor="#f6b73c" />
          <stop offset="72%" stopColor="#e1121b" />
          <stop offset="100%" stopColor="#7a0b12" />
        </linearGradient>
        <filter id="bahiaNeon" x="-35%" y="-30%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.9 0 0.18 0 0 0.04 0 0 0.12 0 0.03 0 0 0 0.7 0" result="redGlow" />
          <feMerge>
            <feMergeNode in="redGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path className="bahia-crest__halo" d="M110 14c50 0 86 38 86 90v112H24V104c0-52 36-90 86-90Z" />
      <path className="bahia-crest__frame" d="M110 18c48 0 82 36 82 88v112H28V106c0-52 34-88 82-88Z" />
      <path className="bahia-crest__inner-frame" d="M110 39c35 0 61 28 61 67v88H49v-88c0-39 26-67 61-67Z" />

      <circle className="bahia-crest__sun" cx="110" cy="102" r="45" />
      <path className="bahia-crest__sun-line" d="M68 103h84" />
      <path className="bahia-crest__sun-line bahia-crest__sun-line--low" d="M75 122h70" />

      <g className="bahia-crest__palm" filter="url(#bahiaNeon)">
        <path className="bahia-crest__trunk" d="M109 199c6-28 5-58-2-92" />
        <path d="M109 107c-15-25-38-34-67-27 23 4 42 14 58 31" />
        <path d="M111 105c-4-28-20-48-47-60 16 20 27 41 34 64" />
        <path d="M114 105c9-25 28-41 58-46-20 16-35 34-46 55" />
        <path d="M113 110c21-17 45-21 72-11-25 1-46 8-63 22" />
        <path d="M111 109c-24 3-45 15-62 36 24-9 45-15 64-18" />
        <path d="M113 111c24 3 43 14 57 35-20-10-39-16-58-18" />
      </g>

      <path className="bahia-crest__base" d="M54 199h112" />
      <path className="bahia-crest__base bahia-crest__base--red" d="M73 214h74" />
      {!compact ? <text className="bahia-crest__year" x="110" y="235" textAnchor="middle">1974</text> : null}
    </svg>
  );
}
