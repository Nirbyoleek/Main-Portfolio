import { useCallback, useEffect, useRef, useState } from "react";
import { person, layers, avatarLines, stats } from "../data/content";
import { useScene, useScrollProgress } from "../hooks";
import CopyButton from "./CopyButton";

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(sectionRef);
  const [layer, setLayer] = useState(-1);
  const [line, setLine] = useState<string | null>(null);
  const lineIdx = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const say = useCallback(() => {
    setLine(avatarLines[lineIdx.current % avatarLines.length]);
    lineIdx.current += 1;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setLine(null), 3600);
  }, []);

  // three.js and the scene load as a separate chunk after the text paints.
  const [canvasRef, scene, state] = useScene(
    () =>
      import("../three/heroScene").then(({ createHeroScene }) => (el: HTMLElement) =>
        createHeroScene(el, {
          layers,
          getProgress: () => progress.current,
          onLayer: setLayer,
          onAvatarClick: say,
          bubbleEl: bubbleRef.current,
        })
      ),
    { eager: true }
  );

  // The avatar introduces itself once the scene is up.
  useEffect(() => {
    if (state !== "ready") return;
    const t = setTimeout(() => {
      if (window.scrollY < 80) scene.current?.wave();
    }, 1400);
    return () => clearTimeout(t);
  }, [state, scene]);

  const current = layer >= 0 ? layers[layer] : null;

  return (
    <section className="hero" id="top" ref={sectionRef} aria-label="Introduction">
      <div className="hero__stage">
        <div className="hero__canvas" ref={canvasRef} />
        {/* A still of the avatar: the whole view on light devices, and a
            placeholder elsewhere until the 3D scene is ready. */}
        <img
          className={`hero__still ${state === "ready" ? "is-hidden" : ""} ${state === "lite" ? "is-lite" : ""}`}
          src="./avatar.webp"
          width="720"
          height="720"
          alt="Illustrated avatar of Nirbyoleek at his desk with a laptop"
          fetchPriority="high"
        />
        <div className={`bubble-anchor ${line ? "is-on" : ""}`} ref={bubbleRef} aria-live="polite">
          {line && <p className="bubble">{line}</p>}
        </div>

        <div className="hero__copy">
          <ul className="hero__status">
            <li>
              <span className="dot" aria-hidden="true" />
              {person.current.title}, {person.current.company}
            </li>
            {person.openTo && <li className="is-open">Open to {person.openTo}</li>}
          </ul>
          <h1 className="hero__name">
            <span>{person.firstName}</span>
            <span>{person.lastName}</span>
          </h1>
          <p className="hero__role">
            <strong>{person.role}.</strong> {person.headline}
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href={`./${person.resume}`} download data-magnetic>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
              </svg>
              Download resume
            </a>
            <a className="btn" href="#contact" data-magnetic>
              Contact me
            </a>
            <CopyButton text={person.email} className="hero__copy-email" />
          </div>
          <dl className="hero__stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={`hero__caption ${current ? "is-on" : ""}`} aria-live="polite">
          {current && (
            <>
              <strong>{current.name}</strong>
              <span>{current.line}</span>
            </>
          )}
        </div>

        {state === "ready" && (
          <p className="hero__hint">
            <button className="link-btn" onClick={() => scene.current?.wave()}>
              Say hi
            </button>{" "}
            or hover the layers of my work.
          </p>
        )}

        <a className="hero__scroll" href="#about" aria-label="Scroll to About">
          <span />
        </a>
      </div>
    </section>
  );
}
