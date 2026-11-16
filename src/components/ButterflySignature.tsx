import { useEffect, useRef } from 'react';
import { prefersReducedMotion, scrollState } from '../lib/motion';
import { LEFT_LOWER, LEFT_UPPER, RIGHT_LOWER, RIGHT_UPPER } from './ButterflyIcon';

/* ---------- Hoja de sprites: la mariposa del logo en varias fases de aleteo y cuatro tonos ---------- */

const SPRITE = 64;
const FRAMES = 7;
const TONES: [string, string][] = [
  ['#f6a5c8', '#d9579a'],
  ['#f8c4dc', '#c58cf0'],
  ['#c58cf0', '#8a5ad8'],
  ['#cdb8f4', '#6a3fc8'],
];

function buildSpriteSheet() {
  const sheet = document.createElement('canvas');
  sheet.width = SPRITE * FRAMES;
  sheet.height = SPRITE * TONES.length;
  const ctx = sheet.getContext('2d')!;
  const wings = [
    [new Path2D(LEFT_UPPER), new Path2D(LEFT_LOWER)],
    [new Path2D(RIGHT_UPPER), new Path2D(RIGHT_LOWER)],
  ];
  const scale = SPRITE / 200;
  TONES.forEach(([from, to], tone) => {
    for (let f = 0; f < FRAMES; f++) {
      // De alas casi cerradas (de canto) a totalmente abiertas
      const open = 0.14 + (0.86 * f) / (FRAMES - 1);
      ctx.save();
      ctx.translate(f * SPRITE, tone * SPRITE + (SPRITE - 160 * scale) / 2);
      ctx.scale(scale, scale);
      const gradient = ctx.createLinearGradient(0, 0, 200, 160);
      gradient.addColorStop(0, from);
      gradient.addColorStop(1, to);
      ctx.fillStyle = gradient;
      for (const side of wings) {
        ctx.save();
        ctx.translate(100, 0);
        ctx.scale(open, 1);
        ctx.translate(-100, 0);
        side.forEach((path) => ctx.fill(path));
        ctx.restore();
      }
      ctx.fillStyle = '#3b1f5c';
      ctx.beginPath();
      ctx.ellipse(100, 84, 4.5, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  return sheet;
}

/* ---------- La firma: el nombre en letra manuscrita convertido en plazas para las mariposas ---------- */

const FONT = '"Great Vibes", "Snell Roundhand", cursive';
const NAME = ['Chiara', 'Capacci'];

interface Signature {
  count: number;
  /** Plaza final de cada mariposa, ordenada como se escribe: de izquierda a derecha y la rúbrica al final */
  x: Float32Array;
  y: Float32Array;
  tone: Uint8Array;
  /** Recorrido de la «pluma» por la firma, en el mismo orden */
  pen: number[];
  /** Tamaño de cada mariposa en píxeles físicos */
  unit: number;
}

function buildSignature(width: number, height: number, isNarrow: boolean, maxCount: number): Signature {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const lines = isNarrow ? NAME : [NAME.join(' ')];

  // Tamaño de letra para que cada línea quepa a lo ancho y el conjunto a lo alto
  ctx.font = `100px ${FONT}`;
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const size = Math.min(((isNarrow ? 0.7 : 0.76) * width * 100) / widest, (height * (isNarrow ? 0.24 : 0.3)));
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';

  const lineHeight = size * 0.92;
  const top = height * 0.48 - (lines.length * lineHeight) / 2 + size * 0.62;
  const boxes = lines.map((line, i) => {
    const w = ctx.measureText(line).width;
    // En móvil el apellido entra algo desplazado, como una firma real
    const left = (width - w) / 2 + (isNarrow ? (i === 0 ? -0.05 : 0.04) * width : 0);
    return { line, left, baseline: top + i * lineHeight, w };
  });

  // Cada línea y la rúbrica se leen por separado para respetar el orden de escritura
  const strokes: { x: number[]; y: number[] }[] = [];
  const read = (paint: () => void) => {
    ctx.clearRect(0, 0, width, height);
    paint();
    const { data } = ctx.getImageData(0, 0, width, height);
    const stroke = { x: [] as number[], y: [] as number[] };
    const step = Math.max(1, Math.round(size / 90));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (data[(y * width + x) * 4 + 3] > 140) {
          stroke.x.push(x + Math.random() * step);
          stroke.y.push(y + Math.random() * step);
        }
      }
    }
    strokes.push(stroke);
  };
  boxes.forEach((box) => read(() => ctx.fillText(box.line, box.left, box.baseline)));
  const last = boxes[boxes.length - 1];
  read(() => {
    // Rúbrica: un trazo largo que nace bajo el nombre y se afina hacia la derecha
    const x0 = boxes[0].left + boxes[0].w * 0.04;
    const y0 = last.baseline + size * 0.2;
    const x1 = last.left + last.w * 1.02;
    ctx.lineWidth = size * 0.05;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 + (x1 - x0) * 0.3, y0 + size * 0.2, x0 + (x1 - x0) * 0.65, y0 - size * 0.1, x1, y0 - size * 0.02);
    ctx.stroke();
  });

  // Cuántas mariposas caben para que el trazo se lea lleno pero sin amontonarse
  const ink = strokes.reduce((sum, s) => sum + s.x.length, 0);
  const unit = Math.max(3.5, size * 0.036);
  const pixelArea = Math.pow(Math.max(1, Math.round(size / 90)), 2);
  const count = Math.min(maxCount, Math.max(200, Math.round((ink * pixelArea) / (unit * unit * 0.15))));
  const keep = count / ink;

  const signature: Signature = {
    count: 0, x: new Float32Array(count), y: new Float32Array(count), tone: new Uint8Array(count), pen: [], unit,
  };
  const minX = Math.min(...boxes.map((b) => b.left));
  const maxX = Math.max(...boxes.map((b) => b.left + b.w));
  strokes.forEach((stroke) => {
    const order = stroke.x.map((_, i) => i).filter(() => Math.random() < keep);
    // De izquierda a derecha, con un poco de mezcla vertical para que la «tinta» caiga natural
    order.sort((a, b) => stroke.x[a] - stroke.x[b]);
    const chunk = Math.max(4, Math.round(order.length / 60));
    for (let i = 0; i < order.length && signature.count < count; i++) {
      const n = signature.count++;
      signature.x[n] = stroke.x[order[i]];
      signature.y[n] = stroke.y[order[i]];
      const along = (signature.x[n] - minX) / (maxX - minX || 1);
      signature.tone[n] = Math.min(3, Math.max(0, Math.round(along * 3 + (Math.random() - 0.5) * 1.1)));
      // La pluma pasa por el centro de cada grupo de puntos: avanza ondulando con las letras
      if (i % chunk === chunk - 1 || i === order.length - 1) {
        let sx = 0, sy = 0, m = 0;
        for (let j = Math.max(0, i - chunk + 1); j <= i; j++, m++) {
          sx += stroke.x[order[j]];
          sy += stroke.y[order[j]];
        }
        signature.pen.push(sx / m, sy / m, n);
      }
    }
  });
  return signature;
}

/* ---------- Recorrido: entra por arriba a la derecha, da una vuelta y escribe la firma ---------- */

const ROUTE: [number, number][] = [
  [1.12, 0.14], [0.85, 0.08], [0.6, 0.16], [0.38, 0.1], [0.16, 0.22], [0.08, 0.42],
];
const SAMPLES = 1600;

interface Path {
  /** Puntos equidistantes */
  table: Float32Array;
  /** Posición (0-1) en el recorrido donde se posa cada mariposa */
  stop: Float32Array;
}

function buildPath(width: number, height: number, signature: Signature): Path {
  const points: number[][] = ROUTE.map(([x, y]) => [x * width, y * height]);
  const marks: number[] = [];
  for (let i = 0; i < signature.pen.length; i += 3) {
    points.push([signature.pen[i], signature.pen[i + 1]]);
    marks.push(points.length - 1, signature.pen[i + 2]);
  }

  // Curva suave (Catmull-Rom) por todos los puntos, recordando dónde cae cada punto de control
  const dense: number[] = [];
  const controlAt: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    controlAt[i] = dense.length / 2;
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const steps = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 6));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      for (let c = 0; c < 2; c++) {
        dense.push(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3));
      }
    }
  }
  controlAt[points.length - 1] = dense.length / 2;
  dense.push(...points[points.length - 1]);

  const lengths = [0];
  for (let i = 2; i < dense.length; i += 2) lengths.push(lengths[lengths.length - 1] + Math.hypot(dense[i] - dense[i - 2], dense[i + 1] - dense[i - 1]));
  const total = lengths[lengths.length - 1] || 1;

  const table = new Float32Array(SAMPLES * 2);
  let j = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const target = (i / (SAMPLES - 1)) * total;
    while (j < lengths.length - 2 && lengths[j + 1] < target) j++;
    const k = (target - lengths[j]) / (lengths[j + 1] - lengths[j] || 1);
    table[i * 2] = dense[j * 2] + (dense[j * 2 + 2] - dense[j * 2]) * k;
    table[i * 2 + 1] = dense[j * 2 + 1] + (dense[j * 2 + 3] - dense[j * 2 + 1]) * k;
  }

  // Cada mariposa se posa cuando la pluma pasa junto a su grupo de puntos
  const stop = new Float32Array(signature.count);
  let previousStop = lengths[controlAt[ROUTE.length - 1]] / total;
  let previousIndex = -1;
  for (let m = 0; m < marks.length; m += 2) {
    const at = lengths[controlAt[marks[m]]] / total;
    const until = marks[m + 1];
    for (let n = previousIndex + 1; n <= until; n++) {
      stop[n] = previousStop + ((at - previousStop) * (n - previousIndex)) / (until - previousIndex);
    }
    previousStop = at;
    previousIndex = until;
  }
  return { table, stop };
}

/* ---------- Componente ---------- */

/** Largo de la fila (fracción del recorrido) y tramo en el que cada mariposa se acomoda en su plaza */
const SPAN = 0.55;
const SETTLE = 0.025;
const REPEL_RADIUS = 80;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Cientos de mariposillas entran en fila, dan una vuelta por la pantalla y, como la punta
 * de una pluma, van escribiendo «Chiara Capacci» con su rúbrica. Luego la firma queda viva.
 */
export function ButterflySignature({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const isReduced = prefersReducedMotion();
    const sheet = buildSpriteSheet();

    let signature: Signature | null = null;
    let path: Path | null = null;
    let posX = new Float32Array(0), posY = new Float32Array(0);
    let pushX = new Float32Array(0), pushY = new Float32Array(0);
    let heading = new Float32Array(0), flap = new Float32Array(0), phase = new Float32Array(0);
    let size = new Float32Array(0), lateral = new Float32Array(0), restTilt = new Float32Array(0), flapRate = new Float32Array(0);
    let isShown = new Uint8Array(0);

    const pointer = { x: -9999, y: -9999 };
    let dpr = 1, width = 0, height = 0;
    let frame = 0, last = performance.now();
    let isVisible = false, isAlive = true;

    const layout = async () => {
      // Sin la letra cargada la firma saldría con la tipografía de reserva
      try {
        await document.fonts.load(`100px ${FONT}`);
      } catch {
        /* seguimos con la letra de reserva */
      }
      if (!isAlive || !canvas.clientWidth) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.round(canvas.clientWidth * dpr);
      height = Math.round(canvas.clientHeight * dpr);
      canvas.width = width;
      canvas.height = height;
      const isNarrow = canvas.clientWidth < canvas.clientHeight * 0.9;
      signature = buildSignature(width, height, isNarrow, isNarrow ? 3200 : 5200);
      path = buildPath(width, height, signature);

      const n = signature.count;
      posX = new Float32Array(n); posY = new Float32Array(n);
      pushX = new Float32Array(n); pushY = new Float32Array(n);
      heading = new Float32Array(n); flap = new Float32Array(n); phase = new Float32Array(n);
      size = new Float32Array(n); lateral = new Float32Array(n); restTilt = new Float32Array(n); flapRate = new Float32Array(n);
      isShown = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        phase[i] = Math.random() * Math.PI * 2;
        size[i] = 0.8 + Math.random() * 0.45;
        lateral[i] = (Math.random() - 0.5) * 2;
        restTilt[i] = (Math.random() - 0.5) * 0.8;
        flapRate[i] = 4 + Math.random() * 3;
        flap[i] = Math.random() * Math.PI;
      }
    };

    const pathAt = (u: number, out: Float32Array) => {
      const table = path!.table;
      const f = Math.min(1, Math.max(0, u)) * (SAMPLES - 1);
      const i = Math.min(SAMPLES - 2, f | 0);
      const k = f - i;
      out[0] = table[i * 2] + (table[i * 2 + 2] - table[i * 2]) * k;
      out[1] = table[i * 2 + 1] + (table[i * 2 + 3] - table[i * 2 + 1]) * k;
      const tx = table[i * 2 + 2] - table[i * 2], ty = table[i * 2 + 3] - table[i * 2 + 1];
      const length = Math.hypot(tx, ty) || 1;
      out[2] = tx / length;
      out[3] = ty / length;
    };
    const along = new Float32Array(4);

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!isVisible || !signature || !path) return;
      const time = now / 1000;
      const progress = isReduced ? 1 : scrollState.signature;
      const { count, x: homeX, y: homeY, tone, unit } = signature;
      const stop = path.stop;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const rect = canvas.getBoundingClientRect();
      const px = (pointer.x - rect.left) * dpr, py = (pointer.y - rect.top) * dpr;
      const repel = REPEL_RADIUS * dpr;
      const wobble = unit * 0.12;

      for (let i = 0; i < count; i++) {
        // Posición en la fila: la primera va delante y las demás la siguen a distancia fija
        const u = progress * (1 + SPAN + SETTLE) - (i / count) * SPAN;
        if (u <= 0) {
          isShown[i] = 0;
          continue;
        }

        // Ya escrita, la firma respira: una ola suave la recorre de izquierda a derecha
        const restX = homeX[i] + Math.sin(time * 1.3 + phase[i]) * wobble;
        const restY = homeY[i] + Math.sin(time * 1.6 - homeX[i] * 0.006) * wobble * 1.6;

        let x: number, y: number;
        const isSettled = u >= stop[i] + SETTLE;
        if (u < stop[i]) {
          // En la fila: una cinta estrecha que ondula a lo largo del recorrido
          pathAt(u, along);
          const wave = (lateral[i] * 5 + Math.sin(u * 140 + phase[i]) * 3) * dpr;
          x = along[0] - along[3] * wave;
          y = along[1] + along[2] * wave;
        } else if (!isSettled) {
          // Se suelta de la pluma y cae en su sitio
          pathAt(stop[i], along);
          const k = easeOut((u - stop[i]) / SETTLE);
          x = along[0] + (restX - along[0]) * k;
          y = along[1] + (restY - along[1]) * k;
        } else {
          x = restX;
          y = restY;
        }

        const prevX = posX[i], prevY = posY[i];
        if (!isShown[i]) {
          posX[i] = x;
          posY[i] = y;
          isShown[i] = 1;
        } else {
          const follow = Math.min(1, dt * (isSettled ? 8 : 16));
          posX[i] += (x - posX[i]) * follow;
          posY[i] += (y - posY[i]) * follow;
        }

        // Se apartan del cursor y vuelven despacio a su trazo
        const dx = posX[i] + pushX[i] - px, dy = posY[i] + pushY[i] - py;
        if (dx < repel && dx > -repel && dy < repel && dy > -repel) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < repel) {
            const force = (1 - distance / repel) * 3.5 * dpr;
            pushX[i] += (dx / (distance || 1)) * force;
            pushY[i] += (dy / (distance || 1)) * force;
          }
        }
        pushX[i] *= 0.93;
        pushY[i] *= 0.93;

        // En vuelo miran hacia donde van; posadas, hacia arriba con un leve giro propio
        const vx = posX[i] - prevX, vy = posY[i] - prevY;
        const isFlying = !isSettled && Math.hypot(vx, vy) > 0.3 * dpr;
        const wanted = isFlying ? Math.atan2(vy, vx) + Math.PI / 2 : restTilt[i] + Math.sin(time * 0.7 + phase[i]) * 0.12;
        let diff = wanted - heading[i];
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        heading[i] += diff * Math.min(1, dt * 7);

        flap[i] += dt * (isFlying ? 15 : flapRate[i]);
        const open = Math.abs(Math.sin(flap[i]));
        const sx = Math.round(open * (FRAMES - 1)) * SPRITE;
        const sy = tone[i] * SPRITE;

        const s = (unit * size[i]) / SPRITE;
        const cos = Math.cos(heading[i]) * s, sin = Math.sin(heading[i]) * s;
        ctx.setTransform(cos, sin, -sin, cos, posX[i] + pushX[i], posY[i] + pushY[i]);
        ctx.drawImage(sheet, sx, sy, SPRITE, SPRITE, -SPRITE / 2, -SPRITE / 2, SPRITE, SPRITE);
      }
    };

    const observer = new IntersectionObserver(([entry]) => (isVisible = entry.isIntersecting));
    observer.observe(canvas);
    const handlePointer = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const handleResize = () => void layout();
    window.addEventListener('pointermove', handlePointer);
    window.addEventListener('resize', handleResize);
    void layout();
    frame = requestAnimationFrame(draw);

    return () => {
      isAlive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
