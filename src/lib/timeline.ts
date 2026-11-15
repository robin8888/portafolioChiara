import { gsap, scrollState } from './motion';

/** Animación de entrada tras el loader: el nombre sube letra a letra y la foto se abre con forma de mariposa. */
export function playHeroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__line .split-char', { yPercent: 115, rotate: 8, duration: 1.4, stagger: 0.045 })
    .fromTo('.reveal--hero', { '--m': 0, '--r': '0%' }, { '--m': 520, '--r': '101%', duration: 2.2, ease: 'power3.inOut' }, 0.1)
    .from('.reveal--hero img', { scale: 1.35, duration: 2.4, ease: 'power3.out' }, 0.1)
    .from('.fade-in', { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, 0.7)
    .from('.hero__perched', { opacity: 0, scale: 0, rotate: -40, duration: 1.2, ease: 'back.out(2)' }, 1.4)
    .from('.site-header', { yPercent: -100, opacity: 0, duration: 1 }, 0.9);
  return tl;
}

/**
 * Todas las animaciones ligadas al desplazamiento horizontal. Usan `containerAnimation`
 * para que los disparadores midan la posición dentro de la pista y no en el scroll vertical.
 */
export function buildPanelAnimations(container: gsap.core.Tween) {
  const base = { containerAnimation: container, scrub: true } as const;

  // Hero: el nombre se queda atrás y la foto se acerca mientras la pista se desliza
  gsap.to('.hero__name', { xPercent: -25, ease: 'none', scrollTrigger: { ...base, trigger: '.panel--hero', start: 'left left', end: 'right left' } });
  gsap.to('.hero__figure', { xPercent: 18, rotate: 3, ease: 'none', scrollTrigger: { ...base, trigger: '.panel--hero', start: 'left left', end: 'right left' } });

  // Frase: las palabras se encienden según avanzas
  gsap.fromTo('.statement .split-word', { opacity: 0.12 }, {
    opacity: 1,
    stagger: 0.1,
    ease: 'none',
    scrollTrigger: { ...base, trigger: '.panel--statement', start: 'left 80%', end: 'right 70%' },
  });

  // Máscaras con forma de mariposa que se abren hasta llenar la imagen o el vídeo
  gsap.utils.toArray<HTMLElement>('.reveal:not(.reveal--hero)').forEach((frame) => {
    gsap.fromTo(frame, { '--m': 0, '--r': '0%' }, {
      '--m': 520,
      '--r': '101%',
      ease: 'power2.inOut',
      scrollTrigger: { ...base, trigger: frame, start: 'left 100%', end: 'left 30%' },
    });
  });

  // Parallax interior: la foto se mueve más despacio que su marco
  gsap.utils.toArray<HTMLElement>('.parallax').forEach((media) => {
    gsap.fromTo(media, { xPercent: -8, scale: 1.18 }, {
      xPercent: 8,
      ease: 'none',
      scrollTrigger: { ...base, trigger: media.parentElement!, start: 'left right', end: 'right left' },
    });
  });

  // Títulos de cada sección: letras que suben al entrar
  gsap.utils.toArray<HTMLElement>('.title, .contact__title').forEach((title) => {
    gsap.from(title.querySelectorAll('.split-char'), {
      yPercent: 110,
      stagger: 0.03,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: { containerAnimation: container, trigger: title, start: 'left 85%', toggleActions: 'play none none reverse' },
    });
  });

  gsap.utils.toArray<HTMLElement>('.styles__item').forEach((item, i) => {
    gsap.from(item, {
      opacity: 0,
      y: 40,
      rotateX: -70,
      duration: 0.9,
      delay: (i % 6) * 0.06,
      ease: 'power3.out',
      scrollTrigger: { containerAnimation: container, trigger: item, start: 'left 90%', toggleActions: 'play none none reverse' },
    });
  });

  // Las cuatro mariposas de las esquinas se posan cuando el vídeo termina de abrirse
  gsap.from('.corner-butterfly svg', {
    scale: 0,
    opacity: 0,
    rotate: -50,
    y: -30,
    duration: 1.1,
    stagger: 0.15,
    ease: 'back.out(2.2)',
    scrollTrigger: { containerAnimation: container, trigger: '.crew__media', start: 'left 55%', toggleActions: 'play none none reverse' },
  });

  gsap.to('.marquee__track', { xPercent: -50, ease: 'none', scrollTrigger: { ...base, trigger: '.panel--styles', start: 'left right', end: 'right left' } });

  // Las micropartículas vuelan desde fuera y forman el retrato mientras llega el contacto
  gsap.fromTo(scrollState, { portrait: 0 }, {
    portrait: 1,
    ease: 'none',
    scrollTrigger: { ...base, trigger: '.panel--contact', start: 'left 95%', end: 'left 5%' },
  });

  // Versión con filtro violeta: la foto entra deslizándose y apareciendo
  if (document.querySelector('.contact__photo')) {
    gsap.fromTo('.contact__photo', { xPercent: 18, opacity: 0 }, {
      xPercent: 0,
      opacity: () => (window.innerWidth <= 820 ? 0.12 : 0.22),
      ease: 'power2.out',
      scrollTrigger: { ...base, trigger: '.panel--contact', start: 'left 90%', end: 'left 10%' },
    });
  }

  // Final: las mariposas 3D se reúnen alrededor del contacto
  gsap.to(scrollState, {
    gather: 1,
    ease: 'none',
    scrollTrigger: { ...base, trigger: '.panel--contact', start: 'left 70%', end: 'left 5%' },
  });
}
