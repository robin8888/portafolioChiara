import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { isTouchDevice, prefersReducedMotion, scrollState } from '../lib/motion';

/* ---------- Geometría del ala (una sola, reutilizada en todas las mariposas) ---------- */

function buildWingGeometry(): THREE.ShapeGeometry {
  const upper = new THREE.Shape();
  upper.moveTo(0, 0.02);
  upper.bezierCurveTo(0.1, 0.5, 0.5, 0.92, 0.97, 0.87);
  upper.bezierCurveTo(1.25, 0.84, 1.2, 0.4, 0.9, 0.17);
  upper.bezierCurveTo(0.72, 0.05, 0.35, 0, 0, 0);

  const lower = new THREE.Shape();
  lower.moveTo(0, -0.025);
  lower.bezierCurveTo(0.32, -0.05, 0.75, -0.15, 0.82, -0.45);
  lower.bezierCurveTo(0.9, -0.75, 0.57, -0.95, 0.35, -0.82);
  lower.bezierCurveTo(0.15, -0.72, 0.05, -0.4, 0, -0.05);

  return new THREE.ShapeGeometry([upper, lower], 24);
}

const wingVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Degradado rosa → lila → violeta desde el cuerpo hacia el borde, venas suaves,
   borde oscuro con puntos claros y un brillo iridiscente que recorre el ala. */
const wingFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHue;
  varying vec2 vPos;

  void main() {
    vec3 blush  = vec3(0.98, 0.70, 0.84);
    vec3 rose   = vec3(0.93, 0.42, 0.68);
    vec3 lilac  = vec3(0.78, 0.62, 0.96);
    vec3 violet = vec3(0.45, 0.25, 0.80);
    vec3 ink    = vec3(0.24, 0.11, 0.42);

    float d = length(vPos * vec2(0.9, 1.1));
    vec3 inner = mix(blush, lilac, uHue);
    vec3 outer = mix(rose, violet, 0.35 + uHue * 0.65);
    vec3 col = mix(inner, outer, smoothstep(0.05, 0.95, d));

    float angle = atan(vPos.y, vPos.x);
    float veins = smoothstep(0.92, 1.0, abs(sin(angle * 9.0)));
    col = mix(col, ink, veins * 0.22 * smoothstep(0.15, 0.6, d));

    float rim = smoothstep(0.78, 1.02, d);
    col = mix(col, ink, rim * 0.75);

    float spots = smoothstep(0.045, 0.0, abs(d - 0.9)) * step(0.5, fract(angle * 3.2));
    col = mix(col, vec3(1.0), spots * 0.85);

    float shimmer = sin(uTime * 2.2 + vPos.x * 7.0 - vPos.y * 5.0) * 0.5 + 0.5;
    col += vec3(0.10, 0.06, 0.14) * shimmer * (1.0 - rim);

    gl_FragColor = vec4(col, 0.94);
  }
`;

/* ---------- Zona prohibida: el vídeo de grupo ---------- */

/** Rectángulo del vídeo en coordenadas de pantalla normalizadas (-1..1), o null si no se ve. */
const videoZone = { isActive: false, left: 0, right: 0, top: 0, bottom: 0 };
const ZONE_MARGIN = 0.12;

function updateVideoZone() {
  const media = document.querySelector('.crew__media');
  if (!media) return void (videoZone.isActive = false);
  const rect = media.getBoundingClientRect();
  const isVisible = rect.right > 0 && rect.left < window.innerWidth;
  videoZone.isActive = isVisible;
  if (!isVisible) return;
  videoZone.left = (rect.left / window.innerWidth) * 2 - 1 - ZONE_MARGIN;
  videoZone.right = (rect.right / window.innerWidth) * 2 - 1 + ZONE_MARGIN;
  videoZone.top = 1 - (rect.top / window.innerHeight) * 2 + ZONE_MARGIN;
  videoZone.bottom = 1 - (rect.bottom / window.innerHeight) * 2 - ZONE_MARGIN;
}

/** Si la mariposa caería encima del vídeo, la lleva al borde más cercano para que nunca lo tape. */
function keepOutOfVideo(target: THREE.Vector3, camera: THREE.Camera) {
  if (!videoZone.isActive) return;
  const screen = target.clone().project(camera);
  const { left, right, top, bottom } = videoZone;
  if (screen.x < left || screen.x > right || screen.y < bottom || screen.y > top) return;
  const exits = [
    { distance: screen.x - left, apply: () => (screen.x = left) },
    { distance: right - screen.x, apply: () => (screen.x = right) },
    { distance: top - screen.y, apply: () => (screen.y = top) },
    { distance: screen.y - bottom, apply: () => (screen.y = bottom) },
  ];
  exits.sort((a, b) => a.distance - b.distance)[0].apply();
  target.copy(screen.unproject(camera));
}

/* ---------- Una mariposa ---------- */

interface ButterflyProps {
  index: number;
  total: number;
  geometry: THREE.ShapeGeometry;
}

function seeded(index: number, salt: number) {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Butterfly({ index, total, geometry }: ButterflyProps) {
  const root = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);
  const { viewport, camera } = useThree();

  const params = useMemo(() => {
    const r = (s: number) => seeded(index, s);
    return {
      anchorX: (r(1) - 0.5) * 1.6,
      anchorY: (r(2) - 0.5) * 1.5,
      z: -3.5 + r(3) * 4.2,
      phase: r(4) * Math.PI * 2,
      freqX: 0.18 + r(5) * 0.25,
      freqY: 0.3 + r(6) * 0.35,
      flap: 7 + r(7) * 5,
      scale: 0.16 + r(8) * 0.2,
      drift: 0.6 + r(9) * 1.1,
      hue: r(10),
    };
  }, [index]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: wingVertex,
        fragmentShader: wingFragment,
        uniforms: { uTime: { value: 0 }, uHue: { value: params.hue } },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [params.hue],
  );

  const current = useRef(new THREE.Vector3(0, -10, params.z));
  const heading = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const group = root.current;
    if (!group || !leftWing.current || !rightWing.current) return;

    const width = viewport.width * 1.25;
    const height = viewport.height;

    // Vuelo libre: deriva en sentido contrario al scroll para que parezcan estar «en el mundo»
    const flow = -scrollState.progress * width * 2.4 * params.drift + t * 0.08 * params.drift;
    let x = params.anchorX * width * 0.5 + Math.sin(t * params.freqX + params.phase) * 1.1 + flow;
    x = ((((x + width / 2) % width) + width) % width) - width / 2;
    let y = params.anchorY * height * 0.5 + Math.sin(t * params.freqY + params.phase) * 0.6;
    y += Math.cos(t * 0.27 + params.phase) * 0.3;

    // La mano del visitante las espanta suavemente
    const px = (scrollState.pointerX * viewport.width) / 2;
    const py = (scrollState.pointerY * viewport.height) / 2;
    const dx = x - px;
    const dy = y - py;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.6) {
      const push = (1.6 - dist) * 0.9;
      x += (dx / (dist || 1)) * push;
      y += (dy / (dist || 1)) * push;
    }

    // Final: se reúnen en una corona alrededor del contacto
    const angle = (index / total) * Math.PI * 2 + t * 0.25;
    const breathe = 1 + Math.sin(t + params.phase) * 0.03;
    const gx = Math.cos(angle) * viewport.width * 0.44 * breathe;
    const gy = Math.sin(angle) * viewport.height * 0.42 * breathe;
    const g = scrollState.gather;
    const target = new THREE.Vector3(
      THREE.MathUtils.lerp(x, gx, g),
      THREE.MathUtils.lerp(y, gy, g),
      THREE.MathUtils.lerp(params.z, 0, g),
    );

    keepOutOfVideo(target, camera);

    const jump = target.distanceTo(current.current) > viewport.width * 0.5;
    const prev = current.current.clone();
    if (jump) current.current.copy(target);
    else current.current.lerp(target, Math.min(1, delta * 2.2));
    group.position.copy(current.current);

    const vx = current.current.x - prev.x;
    const vy = current.current.y - prev.y;
    if (!jump && Math.hypot(vx, vy) > 0.0005) {
      const wanted = Math.atan2(vy, vx) - Math.PI / 2;
      let diff = wanted - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading.current += diff * Math.min(1, delta * 4);
    }
    group.rotation.z = heading.current;
    group.scale.setScalar(params.scale * THREE.MathUtils.clamp(viewport.width / 7.5, 0.68, 1));

    const speed = params.flap + Math.min(Math.abs(scrollState.velocity) * 0.004, 10);
    const flap = Math.sin(t * speed + params.phase);
    const amplitude = 1.05;
    rightWing.current.rotation.y = -flap * amplitude;
    leftWing.current.rotation.y = flap * amplitude;
    group.position.y += flap * 0.03;

    material.uniforms.uTime.value = t;
  });

  return (
    <group ref={root}>
      <group rotation={[-0.75, 0, 0]}>
        <mesh ref={rightWing} geometry={geometry} material={material} />
        <mesh ref={leftWing} geometry={geometry} material={material} scale={[-1, 1, 1]} />
        <mesh position={[0, -0.05, 0.01]}>
          <capsuleGeometry args={[0.035, 0.6, 4, 8]} />
          <meshBasicMaterial color="#3b1f5c" />
        </mesh>
      </group>
    </group>
  );
}

function Swarm({ count }: { count: number }) {
  const geometry = useMemo(buildWingGeometry, []);
  // Prioridad -1: se mide el vídeo antes de mover las mariposas en cada frame
  useFrame(updateVideoZone, -1);
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Butterfly key={index} index={index} total={count} geometry={geometry} />
      ))}
      <Sparkles count={60} scale={[14, 8, 4]} size={2.4} speed={0.25} color="#d9a7f5" opacity={0.7} />
    </>
  );
}

/** Lienzo fijo a pantalla completa por encima del contenido; no captura clics. */
export default function ButterflySwarm() {
  const count = prefersReducedMotion() ? 3 : isTouchDevice() ? 5 : 8;
  return (
    <div className="swarm" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <Swarm count={count} />
      </Canvas>
    </div>
  );
}
