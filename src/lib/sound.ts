import { useEffect, useSyncExternalStore, type RefObject } from 'react';

/**
 * Un único interruptor de sonido para toda la web: el vídeo que esté en pantalla suena
 * si está activado. Los navegadores no dejan reproducir con sonido sin un clic previo,
 * por eso arranca apagado y se enciende con el botón.
 */
let isSoundOn = false;
const listeners = new Set<() => void>();

export function toggleSound() {
  isSoundOn = !isSoundOn;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSound(): boolean {
  return useSyncExternalStore(subscribe, () => isSoundOn);
}

/** Reproduce el vídeo solo mientras se ve, con sonido si el interruptor está encendido. */
export function useVideoPlayback(ref: RefObject<HTMLVideoElement | null>) {
  const isOn = useSound();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let isVisible = false;

    const play = () => {
      video.muted = !isSoundOn;
      video.play().catch(() => {
        // Si el navegador bloquea el audio, seguimos en silencio en vez de dejar el vídeo parado
        video.muted = true;
        video.play().catch(() => undefined);
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) play();
        else video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    const sync = () => {
      if (isVisible) play();
    };
    listeners.add(sync);
    return () => {
      observer.disconnect();
      listeners.delete(sync);
    };
  }, [ref]);

  return isOn;
}
