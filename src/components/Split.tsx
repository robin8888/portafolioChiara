interface SplitProps {
  text: string;
  className?: string;
  by?: 'chars' | 'words';
}

/** Parte un texto en letras o palabras envueltas en máscaras para animarlas con GSAP. */
export function Split({ text, className, by = 'chars' }: SplitProps) {
  if (by === 'words') {
    return (
      <span className={className} aria-label={text}>
        {text.split(' ').map((word, i) => (
          <span key={i} className="split-word" aria-hidden="true">
            {word}&nbsp;
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        // Cada palabra no se parte: las letras van dentro de un bloque sin saltos de línea
        <span key={w} className="split-nowrap" aria-hidden="true">
          {Array.from(word).map((char, i) => (
            <span key={i} className="split-mask">
              <span className="split-char">{char}</span>
            </span>
          ))}
          {w < text.split(' ').length - 1 && <span className="split-mask">{' '}</span>}
        </span>
      ))}
    </span>
  );
}
