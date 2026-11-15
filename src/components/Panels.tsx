import { useRef } from 'react';
import { toggleSound, useVideoPlayback } from '../lib/sound';
import { CONTACT, CONTACT_PORTRAIT, GALLERY, MEDIA, type Copy, type Lang } from '../content';
import { ButterflyIcon } from './ButterflyIcon';
import { ParticlePortrait } from './ParticlePortrait';
import { Split } from './Split';

interface PanelProps {
  copy: Copy;
}

export function HeroPanel({ copy }: PanelProps) {
  return (
    <section className="panel panel--hero" id="top">
      <p className="hero__kicker fade-in">{copy.heroKicker}</p>
      <h1 className="hero__name">
        <Split text="Chiara" className="hero__line" />
        <Split text="Capacci" className="hero__line hero__line--italic" />
      </h1>
      <p className="hero__role fade-in">{copy.heroRole}</p>
      <figure className="hero__figure">
        <div className="reveal reveal--hero arch">
          <img src={MEDIA.hero} alt="Chiara Capacci in a ballet leap" />
        </div>
        <ButterflyIcon className="flutter hero__perched" gradientId="perched-hero" />
      </figure>
      <div className="hero__scroll fade-in">
        <span>{copy.heroScroll}</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
}

export function StatementPanel({ copy }: PanelProps) {
  return (
    <section className="panel panel--statement">
      <p className="statement">
        <Split text={copy.statement} by="words" />
      </p>
    </section>
  );
}

export function ReelPanel({ copy }: PanelProps) {
  const video = useRef<HTMLVideoElement>(null);
  const isMuted = !useVideoPlayback(video);

  return (
    <section className="panel panel--reel" id="reel">
      <div className="reel__text">
        <span className="section-index">01</span>
        <h2 className="title">
          <Split text={copy.reelTitle} />
        </h2>
        <p className="body-text">{copy.reelText}</p>
      </div>
      <div className="reel__frame">
        <div className="reveal arch arch--video" data-cursor={isMuted ? copy.sound.on : copy.sound.off} onClick={toggleSound}>
          <video ref={video} src={MEDIA.showreel} poster={MEDIA.showreelPoster} muted loop playsInline preload="metadata" />
        </div>
        <ButterflyIcon className="flutter reel__perched" gradientId="perched-reel" />
        <span className="reel__caption">Chiara Capacci — {copy.reelTitle} 2026</span>
      </div>
    </section>
  );
}

export function WorkPanel({ copy, lang }: PanelProps & { lang: Lang }) {
  return (
    <section className="panel panel--work" id="work">
      <header className="work__intro">
        <span className="section-index">02</span>
        <h2 className="title title--vertical">
          <Split text={copy.workTitle} />
        </h2>
        <p className="work__subtitle">{copy.workText}</p>
      </header>
      <div className="work__gallery">
        {GALLERY.map((shot, i) => (
          <figure key={shot.src} className={`shot shot--${shot.size} shot--${i % 2 ? 'low' : 'high'}`}>
            <div className="reveal shot__frame" style={{ '--ratio': shot.ratio } as React.CSSProperties}>
              <img src={shot.src} alt={`Chiara Capacci — ${shot.tag[lang]}`} loading="lazy" className="parallax" />
            </div>
            <figcaption>
              <span>{String(i + 1).padStart(2, '0')}</span> {shot.tag[lang]}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function StylesPanel({ copy }: PanelProps) {
  const marquee = copy.styles.join(' ✦ ') + ' ✦ ';
  return (
    <section className="panel panel--styles" id="styles">
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          <span>{marquee}</span>
          <span>{marquee}</span>
        </div>
      </div>
      <div className="styles__grid">
        <div>
          <span className="section-index">03</span>
          <h2 className="title">
            <Split text={copy.stylesTitle} />
          </h2>
          <ul className="styles__list">
            {copy.styles.map((style, i) => (
              <li key={style} className="styles__item">
                <span className="styles__num">{String(i + 1).padStart(2, '0')}</span>
                {style}
              </li>
            ))}
          </ul>
        </div>
        <div className="styles__side">
          <h3 className="subtitle">{copy.availableTitle}</h3>
          <ul className="available__list">
            {copy.available.map((item, i) => (
              <li key={item} className="styles__item">
                <ButterflyIcon className="bullet" gradientId={`bullet-${i}`} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CrewPanel({ copy }: PanelProps) {
  const video = useRef<HTMLVideoElement>(null);
  const isMuted = !useVideoPlayback(video);
  return (
    <section className="panel panel--crew">
      <div className="crew__media">
        <div className="reveal crew__frame" data-cursor={isMuted ? copy.sound.on : copy.sound.off} onClick={toggleSound}>
          <video ref={video} src={MEDIA.crew} poster={MEDIA.crewPoster} muted loop playsInline preload="metadata" />
          <span className="reel-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
            Reel
          </span>
          <span className="reel-handle">@{CONTACT.instagram}</span>
        </div>
        {/* Una mariposa posada en cada esquina del vídeo */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
          <span key={corner} className={`corner-butterfly corner-butterfly--${corner}`} aria-hidden="true">
            <ButterflyIcon className="flutter" gradientId={`corner-${corner}`} />
          </span>
        ))}
      </div>
      <div className="crew__text">
        <span className="section-index">04</span>
        <h2 className="title">
          <Split text={copy.crewTitle} />
        </h2>
        <p className="body-text">{copy.crewText}</p>
      </div>
    </section>
  );
}

export function ContactPanel({ copy }: PanelProps) {
  return (
    <section className="panel panel--contact" id="contact">
      {CONTACT_PORTRAIT === 'particles' ? (
        <ParticlePortrait className="contact__watermark" src="/media/chiara-particles.webp" />
      ) : (
        <img className="contact__watermark contact__photo" src="/media/chiara-violet.webp" alt="" aria-hidden="true" />
      )}
      <p className="contact__kicker">{copy.contactKicker}</p>
      <h2 className="contact__title">
        {copy.contactTitle.map((word, i) => (
          <Split key={word} text={word} className={`contact__line ${i === 1 ? 'is-italic' : ''}`} />
        ))}
      </h2>
      <a className="contact__mail" href={`mailto:${CONTACT.email}`} data-cursor={copy.contactCta}>
        {CONTACT.email}
      </a>
      <div className="contact__meta">
        <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noreferrer" data-cursor="Instagram">
          Instagram — @{CONTACT.instagram}
        </a>
        <span>{CONTACT.city}</span>
      </div>
      <footer className="contact__footer">
        © {new Date().getFullYear()} Chiara Capacci — {copy.rights}
      </footer>
    </section>
  );
}
