interface ButterflyIconProps {
  className?: string;
  /** Dibuja solo el contorno (para la animación de trazo del loader) */
  isOutline?: boolean;
  gradientId?: string;
}

export const RIGHT_UPPER = 'M100 78C108 40 140 6 178 10C200 13 196 48 172 66C158 76 128 80 100 80Z';
export const RIGHT_LOWER = 'M100 82C126 84 160 92 166 116C172 140 146 156 128 146C112 138 104 112 100 84Z';
export const LEFT_UPPER = 'M100 78C92 40 60 6 22 10C0 13 4 48 28 66C42 76 72 80 100 80Z';
export const LEFT_LOWER = 'M100 82C74 84 40 92 34 116C28 140 54 156 72 146C88 138 96 112 100 84Z';

/** Mariposa vectorial con las alas separadas en grupos para poder animarlas (aleteo). */
export function ButterflyIcon({ className, isOutline = false, gradientId = 'bf-grad' }: ButterflyIconProps) {
  const paint = isOutline
    ? { fill: 'none', stroke: `url(#${gradientId})`, strokeWidth: 1.4 }
    : { fill: `url(#${gradientId})` };
  return (
    <svg className={className} viewBox="0 0 200 160" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6a5c8" />
          <stop offset="0.5" stopColor="#c58cf0" />
          <stop offset="1" stopColor="#7c4ddb" />
        </linearGradient>
      </defs>
      <g className="bf-wing bf-wing--left">
        <path d={LEFT_UPPER} {...paint} />
        <path d={LEFT_LOWER} {...paint} />
      </g>
      <g className="bf-wing bf-wing--right">
        <path d={RIGHT_UPPER} {...paint} />
        <path d={RIGHT_LOWER} {...paint} />
      </g>
      <ellipse cx="100" cy="84" rx="3.6" ry="28" fill="#3b1f5c" />
      <path d="M99 58C96 42 88 32 80 27M101 58C104 42 112 32 120 27" fill="none" stroke="#3b1f5c" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
