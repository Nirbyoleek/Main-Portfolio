import { useEffect, useRef, useState } from "react";
import { person, layers, stats } from "../data/content";
import { useScene, useScrollProgress } from "../hooks";
import CopyButton from "./CopyButton";

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(sectionRef);
  const [layer, setLayer] = useState(-1);

  // three.js and the scene load as a separate chunk after the text paints.
  const [canvasRef, , state] = useScene(
    () =>
      import("../three/heroScene").then(({ createHeroScene }) => (el: HTMLElement) =>
        createHeroScene(el, {
          layers,
          getProgress: () => progress.current,
          onLayer: setLayer,
          dark: true,
        })
      ),
    { eager: true }
  );

  // The name spans the stage edge to edge: fit its font size to the width
  // once the font has loaded and the intro animation has finished.
  useEffect(() => {
    const h = nameRef.current;
    if (!h) return;
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const first = h.firstElementChild as HTMLElement | null;
        if (!first) return;
        h.style.fontSize = "";
        const base = parseFloat(getComputedStyle(h).fontSize);
        const w = first.getBoundingClientRect().width;
        if (!w) return;
        const size = Math.min(base * (h.clientWidth / w) * 0.995, 15 * 16);
        h.style.fontSize = `${size.toFixed(2)}px`;
      });
    };
    const done = () => fit();
    h.addEventListener("animationend", done);
    const ro = new ResizeObserver(fit);
    ro.observe(h);
    document.fonts?.ready.then(fit);
    if (!getComputedStyle(h).animationName || getComputedStyle(h).animationName === "none") fit();
    return () => {
      h.removeEventListener("animationend", done);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // A soft spotlight follows the pointer across the stage.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const current = layer >= 0 ? layers[layer] : null;

  return (
    <section className="hero" id="top" ref={sectionRef} aria-label="Introduction">
      <div className="hero__stage" ref={stageRef}>
        <div className="hero__bg" aria-hidden="true">
          <span className="hero__glow" />
          <span className="hero__floor" />
        </div>
        <h1 className="hero__name" ref={nameRef}>
          <span>{person.firstName}</span>
          <span>{person.lastName}</span>
        </h1>
        <div className="hero__canvas" ref={canvasRef} />

        <div className="hero__copy">
          <ul className="hero__status">
            <li>
              <span className="dot" aria-hidden="true" />
              {person.current.title}, {person.current.company}
            </li>
          </ul>
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
            <a className="btn btn--ghost" href="#contact" data-magnetic>
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

        {state === "ready" && <p className="hero__hint">Hover the layers of my work, drag to spin, scroll to assemble.</p>}

        <a className="hero__scroll" href="#about" aria-label="Scroll to About">
          <span />
        </a>
      </div>
    </section>
  );
}
