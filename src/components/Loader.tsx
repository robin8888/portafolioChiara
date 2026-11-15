import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/motion';
import { ButterflyIcon } from './ButterflyIcon';

interface LoaderProps {
  label: string;
  onDone: () => void;
}

/** Precarga las fotos, dibuja la mariposa y al terminar «abre las alas» para mostrar la web. */
export function Loader({ label, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const images = ['/media/chiara-5.webp', '/media/chiara-1.webp', '/media/chiara-3.webp', '/media/showreel-poster.webp'];
      const progress = { value: 0 };
      let loaded = 0;
      const ready = Promise.all(
        images.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = img.onerror = () => {
                loaded += 1;
                gsap.to(progress, { value: (loaded / images.length) * 100, duration: 0.6 });
                resolve();
              };
              img.src = src;
            }),
        ),
      );

      gsap.ticker.add(updateCounter);
      function updateCounter() {
        if (counter.current) counter.current.textContent = String(Math.round(progress.value)).padStart(3, '0');
      }

      const paths = root.current!.querySelectorAll<SVGPathElement>('.loader__outline path');
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });

      const intro = gsap.timeline();
      intro
        .to(paths, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.08 })
        .to('.loader__fill', { opacity: 1, duration: 0.6 }, '-=0.3')
        .to('.loader__fill .bf-wing--left', { scaleX: 0.25, duration: 0.22, yoyo: true, repeat: 5, ease: 'sine.inOut', transformOrigin: '100px 80px' }, '<')
        .to('.loader__fill .bf-wing--right', { scaleX: 0.25, duration: 0.22, yoyo: true, repeat: 5, ease: 'sine.inOut', transformOrigin: '100px 80px' }, '<');

      // En StrictMode el efecto se monta dos veces: la primera pasada no debe cerrar el loader
      let isCancelled = false;
      Promise.all([ready, intro.then()]).then(() => {
        if (isCancelled) return;
        gsap.ticker.remove(updateCounter);
        progress.value = 100;
        updateCounter();
        gsap
          .timeline({ onComplete: onDone })
          .to('.loader__center', { scale: 0.6, opacity: 0, duration: 0.6, ease: 'power3.in' })
          .to('.loader__wing--left', { xPercent: -100, rotateY: 35, duration: 1.2, ease: 'expo.inOut' }, '-=0.15')
          .to('.loader__wing--right', { xPercent: 100, rotateY: -35, duration: 1.2, ease: 'expo.inOut' }, '<');
      });

      return () => {
        isCancelled = true;
        gsap.ticker.remove(updateCounter);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="loader" role="status" aria-label="Loading">
      <div className="loader__wing loader__wing--left" />
      <div className="loader__wing loader__wing--right" />
      <div className="loader__center">
        <div className="loader__mark">
          <ButterflyIcon className="loader__outline" isOutline gradientId="loader-stroke" />
          <ButterflyIcon className="loader__fill" gradientId="loader-fill" />
        </div>
        <p className="loader__label">{label}</p>
        <span ref={counter} className="loader__count">000</span>
      </div>
    </div>
  );
}
