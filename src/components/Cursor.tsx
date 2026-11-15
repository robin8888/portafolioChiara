import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/motion';

/** Cursor propio: un punto y un anillo que crece con una etiqueta sobre vídeos y enlaces. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!dot.current || !ring.current) return;
    const dotX = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const ringY = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });

    const move = (event: PointerEvent) => {
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button');
      setLabel(target ? (target.dataset.cursor ?? '') : '');
      ring.current?.classList.toggle('is-active', Boolean(target));
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span>{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
