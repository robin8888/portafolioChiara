import { useLayoutEffect, useRef } from 'react';
import type { Lang } from '../content';
import { gsap } from '../lib/motion';
import { ButterflyIcon } from './ButterflyIcon';

interface LangSwitchProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

const LANGS: Lang[] = ['en', 'es'];

/** Interruptor de idioma: una píldora rosa-lila se desliza y una mariposa vuela en arco hasta el idioma elegido. */
export function LangSwitch({ lang, onChange }: LangSwitchProps) {
  const root = useRef<HTMLDivElement>(null);
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    const index = LANGS.indexOf(lang);
    const thumb = root.current!.querySelector('.lang__thumb');
    const butterfly = root.current!.querySelector('.lang__butterfly');
    const x = `${index * 100}%`;
    if (isFirst.current) {
      gsap.set(thumb, { x });
      gsap.set(butterfly, { left: `${25 + index * 50}%` });
      isFirst.current = false;
      return;
    }
    gsap.to(thumb, { x, duration: 0.9, ease: 'elastic.out(1, 0.75)' });
    gsap
      .timeline()
      .to(butterfly, { left: `${25 + index * 50}%`, duration: 0.9, ease: 'power2.inOut' })
      .to(butterfly, { y: -22, rotate: index ? 25 : -25, scale: 1.4, duration: 0.45, ease: 'sine.out' }, 0)
      .to(butterfly, { y: 0, rotate: 0, scale: 1, duration: 0.45, ease: 'sine.in' }, 0.45);
  }, [lang]);

  return (
    <div ref={root} className="lang" role="group" aria-label="Language">
      <span className="lang__thumb" aria-hidden="true" />
      <ButterflyIcon className="lang__butterfly flutter" gradientId="lang-butterfly" />
      {LANGS.map((code) => (
        <button key={code} className={code === lang ? 'is-active' : ''} aria-pressed={code === lang} onClick={() => onChange(code)}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
