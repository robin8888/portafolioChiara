import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { COPY, type Lang } from './content';
import { gsap, isTouchDevice, ScrollTrigger, scrollState, useGSAP } from './lib/motion';
import { buildPanelAnimations, playHeroIntro } from './lib/timeline';
import { ButterflyIcon } from './components/ButterflyIcon';
import { Cursor } from './components/Cursor';
import { LangSwitch } from './components/LangSwitch';
import { SpeakerIcon } from './components/SpeakerIcon';
import { Loader } from './components/Loader';
import { ContactPanel, CrewPanel, HeroPanel, ReelPanel, StatementPanel, StylesPanel, WorkPanel } from './components/Panels';
import { toggleSound, useSound } from './lib/sound';

// La escena 3D (three.js) va en un archivo aparte para que el loader aparezca al instante
const ButterflySwarm = lazy(() => import('./components/ButterflySwarm'));

function readInitialLang(): Lang {
  try {
    const saved = localStorage.getItem('chiara-lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    /* almacenamiento bloqueado: usamos el idioma del navegador */
  }
  return navigator.language.startsWith('es') ? 'es' : 'en';
}

export function App() {
  const [lang, setLang] = useState<Lang>(readInitialLang);
  const [isReady, setIsReady] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const container = useRef<gsap.core.Tween | null>(null);
  const copy = COPY[lang];
  const isSoundOn = useSound();

  // Scroll suave (Lenis) sincronizado con el reloj de GSAP
  useEffect(() => {
    const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.current = instance;
    instance.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    instance.stop();
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
    };
  }, []);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      scrollState.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('chiara-lang', lang);
    } catch {
      /* sin almacenamiento: el idioma solo dura esta visita */
    }
  }, [lang]);

  // Pista horizontal: la sección se fija y el scroll vertical la desplaza de lado
  useGSAP(
    () => {
      if (!isReady || !track.current) return;
      const distance = () => track.current!.scrollWidth - window.innerWidth;
      const tween = gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrapper.current,
          pin: true,
          scrub: 1,
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scrollState.progress = self.progress;
            scrollState.velocity = self.getVelocity();
            gsap.set('.progress__fill', { scaleX: self.progress });
            gsap.set('.progress__butterfly', { left: `${self.progress * 100}%` });
          },
        },
      });
      container.current = tween;
      buildPanelAnimations(tween);
      ScrollTrigger.refresh();
    },
    { dependencies: [isReady, lang], revertOnUpdate: true },
  );

  const handleLoaded = () => {
    setIsReady(true);
    lenis.current?.start();
    requestAnimationFrame(() => playHeroIntro());
  };

  const goTo = (selector: string) => {
    const panel = document.querySelector<HTMLElement>(selector);
    const trigger = container.current?.scrollTrigger;
    if (!panel || !trigger || !track.current) return;
    const distance = track.current.scrollWidth - window.innerWidth;
    const ratio = Math.min(1, panel.offsetLeft / distance);
    lenis.current?.scrollTo(trigger.start + ratio * (trigger.end - trigger.start), { duration: 2.2 });
  };

  /**
   * Cambio de idioma con calma: un velo rosado y una mariposa cruzan la pantalla,
   * los textos cambian bajo el velo y reaparecen desenfocándose suavemente.
   */
  const isChangingLang = useRef(false);
  const changeLang = (next: Lang) => {
    if (next === lang || isChangingLang.current) return;
    isChangingLang.current = true;
    const direction = next === 'es' ? 1 : -1;
    gsap
      .timeline({ onComplete: () => void (isChangingLang.current = false) })
      .set('.lang-veil', { display: 'block' })
      .fromTo('.lang-veil', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'sine.inOut' })
      .fromTo(
        '.lang-veil__butterfly',
        { xPercent: -50, x: () => -direction * window.innerWidth * 0.6, y: 60, rotate: direction * 60, scale: 0.6 },
        { x: () => direction * window.innerWidth * 0.6, y: -40, rotate: direction * 70, scale: 1.1, duration: 1.4, ease: 'power1.inOut' },
        0,
      )
      .to('.track', { opacity: 0, filter: 'blur(10px)', duration: 0.45, ease: 'sine.in' }, 0)
      .add(() => setLang(next), 0.5)
      .fromTo('.track', { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'sine.out' }, 0.7)
      .to('.lang-veil', { opacity: 0, duration: 0.7, ease: 'sine.inOut' }, 0.8)
      .set('.lang-veil', { display: 'none' })
      .set('.track', { clearProps: 'filter' });
  };

  const navItems: [string, string][] = [
    ['#reel', copy.nav.reel],
    ['#work', copy.nav.work],
    ['#styles', copy.nav.styles],
    ['#contact', copy.nav.contact],
  ];

  return (
    <>
      {!isReady && <Loader label={copy.loading} onDone={handleLoaded} />}
      <Suspense fallback={null}>
        <ButterflySwarm />
      </Suspense>
      {!isTouchDevice() && <Cursor />}

      <header className="site-header">
        <button className="brand" onClick={() => goTo('#top')} aria-label="Chiara Capacci — inicio">
          <ButterflyIcon className="brand__icon" gradientId="brand-grad" />
          <span>Chiara Capacci</span>
        </button>
        <nav className="site-nav" aria-label="Sections">
          {navItems.map(([target, label]) => (
            <button key={target} onClick={() => goTo(target)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="header-tools">
        <button className="sound-toggle" onClick={toggleSound} aria-pressed={isSoundOn} aria-label={isSoundOn ? copy.sound.off : copy.sound.on}>
          <SpeakerIcon isOn={isSoundOn} />
          <span className="sound-toggle__label">{isSoundOn ? copy.sound.off : copy.sound.on}</span>
        </button>
          <LangSwitch lang={lang} onChange={changeLang} />
        </div>
      </header>

      <div className="lang-veil" aria-hidden="true">
        <ButterflyIcon className="lang-veil__butterfly flutter" gradientId="veil-butterfly" />
      </div>

      <main ref={wrapper} className="horizontal">
        <div ref={track} className="track">
          <HeroPanel copy={copy} />
          <StatementPanel copy={copy} />
          <ReelPanel copy={copy} />
          <WorkPanel copy={copy} lang={lang} />
          <StylesPanel copy={copy} />
          <CrewPanel copy={copy} />
          <ContactPanel copy={copy} />
        </div>
      </main>

      <div className="progress" aria-hidden="true">
        <div className="progress__fill" />
        <ButterflyIcon className="progress__butterfly flutter" gradientId="progress-grad" />
      </div>
    </>
  );
}
