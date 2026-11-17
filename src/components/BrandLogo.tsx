import React, { useId } from 'react';

interface BrandMarkProps {
  className?: string;
  title?: string;
}

/** Sygnet LimeControl — pokrętło z lime-łukiem. Działa w trybie jasnym i ciemnym. */
export const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-8 w-8', title }) => {
  const uid = useId().replace(/:/g, '');
  const lime = `lc-lime-${uid}`;
  const knob = `lc-knob-${uid}`;
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={lime} x1="40" y1="200" x2="200" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4CAF2A" />
          <stop offset="1" stopColor="#A3E635" />
        </linearGradient>
        <radialGradient id={knob} cx="104" cy="100" r="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2A8A4C" />
          <stop offset="1" stopColor="#0E3B22" />
        </radialGradient>
      </defs>
      <path
        d="M69.09 170.91A72 72 0 1 1 170.91 170.91"
        className="stroke-[#1B5E36] dark:stroke-white/15"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M69.09 170.91A72 72 0 1 1 182.35 84"
        stroke={`url(#${lime})`}
        strokeWidth="26"
        strokeLinecap="round"
      />
      <circle cx="120" cy="120" r="40" fill={`url(#${knob})`} stroke="#A3E635" strokeOpacity=".3" strokeWidth="2.5" />
      <path d="M120 120L146 105" stroke="#A3E635" strokeWidth="10" strokeLinecap="round" />
      <circle cx="120" cy="120" r="7" fill="#A3E635" />
    </svg>
  );
};

/** Logotyp: sygnet + „limeControl”. */
export const BrandLogo: React.FC<{
  className?: string;
  markClassName?: string;
  /** Ukryj napis na wąskich ekranach (zostaje sam sygnet). */
  compact?: boolean;
}> = ({ className = '', markClassName = 'h-8 w-8', compact = false }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <BrandMark className={markClassName} />
    <span className={`font-display text-lg tracking-tight leading-none ${compact ? 'hidden sm:inline' : ''}`}>
      <span className="font-medium text-emerald-600 dark:text-emerald-300">lime</span>
      <span className="font-extrabold text-brand-ink dark:text-white">Control</span>
    </span>
  </span>
);
