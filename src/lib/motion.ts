import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Estado compartido entre el scroll (GSAP) y la escena 3D (R3F).
 * Se lee en cada frame sin pasar por React para no re-renderizar.
 */
export const scrollState = {
  progress: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  /** 1 en la sección final: las mariposas se reúnen alrededor del contacto */
  gather: 0,
  /** 0 = partículas dispersas, 1 = retrato de la marca de agua formado */
  portrait: 0,
  /** 0 = mariposas fuera de escena, 1 = firma escrita */
  signature: 0,
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export { gsap, ScrollTrigger, useGSAP };
