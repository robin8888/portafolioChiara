import { useEffect, useRef } from 'react';
import { scrollState } from '../lib/motion';

interface ParticlePortraitProps {
  src: string;
  className?: string;
}

/** Partículas guardadas en arrays planos: con decenas de miles, los objetos serían demasiado lentos. */
interface ParticleField {
  count: number;
  homeX: Float32Array;
  homeY: Float32Array;
  scatterX: Float32Array;
  scatterY: Float32Array;
  offsetX: Float32Array;
  offsetY: Float32Array;
  phase: Float32Array;
  delay: Float32Array;
  weight: Float32Array;
  rgb: Uint32Array;
}

const REPEL_RADIUS_CSS_PX = 80;
const TOP_COLOR = [138, 90, 216];
const BOTTOM_COLOR = [214, 92, 160];

/**
 * Lee la foto (escala de grises, fondo negro) a la resolución real de la pantalla y crea
 * una partícula por píxel con una probabilidad que sigue la luz: los rasgos quedan nítidos.
 */
function readParticles(image: HTMLImageElement, width: number, height: number, step: number): ParticleField {
  const sampler = document.createElement('canvas');
  sampler.width = width;
  sampler.height = height;
  const context = sampler.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  const capacity = Math.ceil((width / step + 1) * (height / step + 1));
  const field: ParticleField = {
    count: 0,
    homeX: new Float32Array(capacity),
    homeY: new Float32Array(capacity),
    scatterX: new Float32Array(capacity),
    scatterY: new Float32Array(capacity),
    offsetX: new Float32Array(capacity),
    offsetY: new Float32Array(capacity),
    phase: new Float32Array(capacity),
    delay: new Float32Array(capacity),
    weight: new Float32Array(capacity),
    rgb: new Uint32Array(capacity),
  };

  for (let y = 0; y < height; y += step) {
    const t = y / height;
    const r = Math.round(TOP_COLOR[0] + (BOTTOM_COLOR[0] - TOP_COLOR[0]) * t);
    const g = Math.round(TOP_COLOR[1] + (BOTTOM_COLOR[1] - TOP_COLOR[1]) * t);
    const b = Math.round(TOP_COLOR[2] + (BOTTOM_COLOR[2] - TOP_COLOR[2]) * t);
    // ImageData en little-endian: 0xAABBGGRR. Guardamos el color sin alfa y lo añadimos al dibujar
    const rgb = (b << 16) | (g << 8) | r;
    for (let x = 0; x < width; x += step) {
      const light = data[((y | 0) * width + (x | 0)) * 4] / 255;
      // Exponente alto: las sombras (ojos, boca, contornos) quedan casi vacías y los rasgos se leen
      if (light < 0.08 || Math.random() > Math.pow(light, 1.6)) continue;
      const i = field.count++;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random();
      field.homeX[i] = x + Math.random() * step;
      field.homeY[i] = y + Math.random() * step;
      // Nube de polvo dentro del propio lienzo (fuera de él no se dibujaría)
      field.scatterX[i] = Math.min(width - 1, Math.max(0, x + Math.cos(angle) * width * distance * 0.6));
      field.scatterY[i] = Math.min(height - 1, Math.max(0, y + Math.sin(angle) * height * distance * 0.35));
      field.phase[i] = Math.random() * Math.PI * 2;
      field.delay[i] = Math.random() * 0.35;
      field.weight[i] = 0.55 + light * 0.45;
      field.rgb[i] = rgb;
    }
  }
  return field;
}

const easeOutCubic = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

/**
 * Retrato hecho de micropartículas finas: se forman al llegar al contacto (scrollState.portrait),
 * parpadean levemente y se apartan del cursor como polvo.
 */
export function ParticlePortrait({ src, className }: ParticlePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext('2d')!;
    const image = new Image();
    let field: ParticleField | null = null;
    let pixels: ImageData | null = null;
    let buffer: Uint32Array | null = null;
    let frame = 0;
    let isVisible = false;
    let dpr = 1;
    const pointer = { x: -9999, y: -9999 };

    const build = () => {
      if (!image.complete || !image.naturalWidth) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssHeight = canvas.clientHeight;
      const cssWidth = Math.round(cssHeight * (image.naturalWidth / image.naturalHeight));
      canvas.style.width = `${cssWidth}px`;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      const isSmallScreen = window.innerWidth <= 820;
      // Paso de ~1 px físico; algo más en móvil para no gastar batería
      // Menos de 1 px de paso: varias partículas por píxel que se suman y dibujan los tonos medios
      const step = isSmallScreen ? 0.9 : dpr >= 2 ? 1 : 0.75;
      field = readParticles(image, canvas.width, canvas.height, step);
      pixels = context.createImageData(canvas.width, canvas.height);
      buffer = new Uint32Array(pixels.data.buffer);
    };

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!isVisible || !field || !pixels || !buffer) return;
      const width = canvas.width;
      const height = canvas.height;
      const seconds = time / 1000;
      const formation = scrollState.portrait;
      const rect = canvas.getBoundingClientRect();
      const localX = (pointer.x - rect.left) * dpr;
      const localY = (pointer.y - rect.top) * dpr;
      const radius = REPEL_RADIUS_CSS_PX * dpr;
      const sway = 0.5 * dpr;

      buffer.fill(0);
      const { homeX, homeY, scatterX, scatterY, offsetX, offsetY, phase, delay, weight, rgb } = field;
      for (let i = 0; i < field.count; i++) {
        const local = (formation - delay[i]) / (1 - delay[i]);
        const progress = local <= 0 ? 0 : local >= 1 ? 1 : easeOutCubic(local);
        let x = scatterX[i] + (homeX[i] - scatterX[i]) * progress + Math.sin(seconds * 0.9 + phase[i]) * sway;
        let y = scatterY[i] + (homeY[i] - scatterY[i]) * progress + Math.cos(seconds * 0.7 + phase[i]) * sway;

        const dx = x + offsetX[i] - localX;
        const dy = y + offsetY[i] - localY;
        if (dx < radius && dx > -radius && dy < radius && dy > -radius) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < radius) {
            const force = (1 - distance / radius) * 5 * dpr;
            offsetX[i] += (dx / (distance || 1)) * force;
            offsetY[i] += (dy / (distance || 1)) * force;
          }
        }
        offsetX[i] *= 0.92;
        offsetY[i] *= 0.92;
        x += offsetX[i];
        y += offsetY[i];

        const px = x | 0;
        const py = y | 0;
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const twinkle = 0.7 + Math.sin(seconds * 2 + phase[i] * 3) * 0.3;
        const alpha = 150 * weight[i] * twinkle * (0.35 + 0.65 * progress);
        // Suma de luz: donde se acumulan partículas el tono se intensifica, como en un grabado
        const index = py * width + px;
        const total = Math.min(255, (buffer[index] >>> 24) + alpha) | 0;
        buffer[index] = ((total << 24) | rgb[i]) >>> 0;
      }
      context.putImageData(pixels, 0, 0);
    };

    const observer = new IntersectionObserver(([entry]) => (isVisible = entry.isIntersecting));
    observer.observe(canvas);
    const handlePointer = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    window.addEventListener('pointermove', handlePointer);
    window.addEventListener('resize', build);
    image.onload = build;
    image.src = src;
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('resize', build);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
