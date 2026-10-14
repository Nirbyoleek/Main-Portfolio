import { useCallback, useRef, useState } from "react";
import { person, layers, avatarLines } from "../data/content.js";
import { useScene, useScrollProgress } from "../hooks.js";
import { createHeroScene } from "../three/heroScene.js";

export default function Hero() {
  const sectionRef = useRef(null);
  const bubbleRef = useRef(null);
  const progress = useScrollProgress(sectionRef);
  const [layer, setLayer] = useState(-1);
  const [line, setLine] = useState(null);
  const lineIdx = useRef(0);
  const hideTimer = useRef(0);

  const say = useCallback(() => {
    setLine(avatarLines[lineIdx.current % avatarLines.length]);
    lineIdx.current += 1;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setLine(null), 3200);
  }, []);

  const [canvasRef, scene, state] = useScene(
    (el) =>
      createHeroScene(el, {
        layers,
        getProgress: () => progress.current,
        onLayer: setLayer,
        onAvatarClick: say,
        bubbleEl: bubbleRef.current,
      }),
    { eager: true }
  );

  const pickLayer = (i) => {
    setLayer(i);
    scene.current?.highlight(i);
  };

  const current = layer >= 0 ? layers[layer] : null;

  return (
    <section className="hero" id="top" ref={sectionRef} aria-label="Introduction">
      <div className="hero__stage">
        <div className="hero__canvas" ref={canvasRef} />
        <div className={`bubble-anchor ${line ? "is-on" : ""}`} ref={bubbleRef} aria-live="polite">
          {line && <p className="bubble">{line}</p>}
        </div>

        <div className="hero__copy">
          <h1 className="hero__name">
            <span>{person.firstName}</span>
            <span>{person.lastName}</span>
          </h1>
          <p className="hero__role">
            {person.role} at Tiger Analytics, building for PepsiCo and Wolters Kluwer in React,
            TypeScript and Node.js.
          </p>
        </div>

        <aside className="hero__panel" aria-label="Layer details">
          <div className="hero__meter" aria-hidden="true">
            <span className="hero__meter-a">Taken apart</span>
            <span className="hero__meter-track">
              <span className="hero__meter-fill" />
            </span>
            <span className="hero__meter-b">Put together</span>
          </div>
          {current ? (
            <div className="hero__layer" key={current.key}>
              <strong>{current.name}</strong>
              <p>{current.line}</p>
            </div>
          ) : (
            <div className="hero__layer hero__layer--hint">
              <strong>Five layers, one feature</strong>
              <p>
                {state === "unsupported"
                  ? "Your browser can't show the 3D view, but everything below works."
                  : "Hover a layer to see what I own there. Drag to spin the stack. Scroll to snap it shut."}
              </p>
            </div>
          )}
          <ol className="hero__layer-list">
            {layers.map((l, i) => (
              <li key={l.key}>
                <button
                  className={i === layer ? "is-active" : ""}
                  aria-pressed={i === layer}
                  onMouseEnter={() => pickLayer(i)}
                  onFocus={() => pickLayer(i)}
                  onClick={() => pickLayer(i === layer ? -1 : i)}
                >
                  {l.name}
                </button>
              </li>
            ))}
          </ol>
          {state === "ready" && (
            <button className="link-btn" onClick={() => scene.current?.wave()}>
              Say hi to the avatar
            </button>
          )}
        </aside>

        <a className="hero__scroll" href="#about">
          Scroll
        </a>
      </div>
    </section>
  );
}
