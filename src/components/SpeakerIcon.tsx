interface SpeakerIconProps {
  isOn: boolean;
}

/** Altavoz: con sonido muestra ondas que laten; en silencio, una cruz. */
export function SpeakerIcon({ isOn }: SpeakerIconProps) {
  return (
    <svg className={`speaker ${isOn ? 'is-on' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="speaker-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ee8fbd" />
          <stop offset="1" stopColor="#8a5ad8" />
        </linearGradient>
      </defs>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="url(#speaker-grad)" />
      {isOn ? (
        <g fill="none" stroke="url(#speaker-grad)" strokeWidth="1.6" strokeLinecap="round">
          <path className="speaker__wave speaker__wave--1" d="M15 9.2a4 4 0 0 1 0 5.6" />
          <path className="speaker__wave speaker__wave--2" d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4" />
        </g>
      ) : (
        <g stroke="#8a5ad8" strokeWidth="1.6" strokeLinecap="round">
          <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
        </g>
      )}
    </svg>
  );
}
