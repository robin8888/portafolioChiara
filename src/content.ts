/**
 * Todos los textos del portafolio, en inglés y español.
 * Cambia aquí los datos de contacto y la biografía: el resto de la web se actualiza sola.
 */
export type Lang = 'en' | 'es';

export const CONTACT = {
  // ⚠️ Sustituir por los datos reales de Chiara
  email: 'kiaky.na92@hotmail.it',
  instagram: 'pro_akira',
  city: 'Madrid · Available worldwide',
};

/**
 * Cómo se muestra la foto del contacto:
 * - 'filter': la foto con filtro violeta (duotono)
 * - 'particles': retrato hecho de micropartículas
 */
export const CONTACT_PORTRAIT: 'filter' | 'particles' = 'filter';

export const MEDIA = {
  hero: '/media/chiara-5.webp',
  showreel: '/media/showreel.mp4',
  showreelPoster: '/media/showreel-poster.webp',
  crew: '/media/crew.mp4',
  crewPoster: '/media/crew-poster.webp',
};

export interface GalleryShot {
  src: string;
  tag: { en: string; es: string };
  size: 'tall' | 'mid';
  /** Ancho / alto de la foto: el marco usa su proporción real para no recortarla */
  ratio: number;
}

export const GALLERY: GalleryShot[] = [
  { src: '/media/chiara-1.webp', tag: { en: 'Contemporary', es: 'Contemporáneo' }, size: 'tall', ratio: 1368 / 2400 },
  { src: '/media/chiara-3.webp', tag: { en: 'Modeling', es: 'Modelaje' }, size: 'mid', ratio: 1732 / 2400 },
  { src: '/media/chiara-6.webp', tag: { en: 'Sessions', es: 'Sesiones' }, size: 'mid', ratio: 1686 / 2400 },
  { src: '/media/chiara-2.webp', tag: { en: 'Street', es: 'Street' }, size: 'tall', ratio: 1600 / 2400 },
  { src: '/media/chiara-4.webp', tag: { en: 'Urban couture', es: 'Moda urbana' }, size: 'mid', ratio: 1600 / 2400 },
];

export const COPY = {
  en: {
    nav: { reel: 'Showreel', work: 'Portfolio', styles: 'Styles', contact: 'Booking' },
    loading: 'Metamorphosis',
    heroKicker: 'Portfolio — 2026',
    heroRole: 'Choreographer · Dancer',
    heroScroll: 'Scroll to unfold',
    statement: 'Movement is my mother tongue — every body tells a story.',
    reelTitle: 'Showreel',
    reelText: 'A minute of presence, musicality and control.',
    sound: { on: 'Sound on', off: 'Sound off' },
    workTitle: 'Metamorphosis',
    workText: 'One artist, many skins.',
    stylesTitle: 'Disciplines',
    styles: ['Contemporary', 'Ballet', 'Commercial', 'Urban', 'Heels', 'Pilates'],
    availableTitle: 'Available for',
    available: ['World tours', 'Music videos', 'Live shows & TV', 'Fashion & campaigns', 'Stage productions'],
    crewTitle: 'On stage',
    crewText: 'Duet — connection, trust and breath shared in every count.',
    contactKicker: 'Representation & booking',
    contactTitle: ["Let's", 'create', 'together'],
    contactCta: 'Write to me',
    rights: 'All rights reserved',
  },
  es: {
    nav: { reel: 'Videobook', work: 'Portafolio', styles: 'Estilos', contact: 'Contratación' },
    loading: 'Metamorfosis',
    heroKicker: 'Portafolio — 2026',
    heroRole: 'Coreógrafa · Bailarina',
    heroScroll: 'Desliza para desplegar',
    statement: 'El movimiento es mi lengua materna — cada cuerpo cuenta una historia.',
    reelTitle: 'Videobook',
    reelText: 'Un minuto de presencia, musicalidad y control.',
    sound: { on: 'Con sonido', off: 'Sin sonido' },
    workTitle: 'Metamorfosis',
    workText: 'Una artista, muchas pieles.',
    stylesTitle: 'Disciplinas',
    styles: ['Contemporáneo', 'Ballet', 'Comercial', 'Urbano', 'Heels', 'Pilates'],
    availableTitle: 'Disponible para',
    available: ['Giras mundiales', 'Videoclips', 'Directos y televisión', 'Moda y campañas', 'Producciones escénicas'],
    crewTitle: 'En escena',
    crewText: 'Dúo — conexión, confianza y respiración compartida en cada tiempo.',
    contactKicker: 'Representación y contratación',
    contactTitle: ['Creemos', 'algo', 'juntos'],
    contactCta: 'Escríbeme',
    rights: 'Todos los derechos reservados',
  },
} as const;

export type Copy = (typeof COPY)[Lang];
