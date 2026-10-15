import { useCallback, useEffect, useRef, useState } from "react";
import { person, layers, avatarLines, avatarQA, stats, avatarModel } from "../data/content";
import { shouldUse3D, useScene, useScrollProgress } from "../hooks";
import type { ProAvatar } from "../three/proAvatar";
import CopyButton from "./CopyButton";

const STILL = avatarModel?.still ?? "./avatar.webp";

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const pro = useRef<ProAvatar | null>(null);
  const [proReady, setProReady] = useState(false);
  const progress = useScrollProgress(sectionRef);
  const [layer, setLayer] = useState(-1);
  const [line, setLine] = useState<string | null>(null);
  const [asked, setAsked] = useState(-1);
  const lineIdx = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const talkId = useRef(0);

  /** Show a line in the bubble; with the rigged avatar, it also says it. */
  const speak = useCallback((text: string, gesture?: string) => {
    clearTimeout(hideTimer.current);
    const id = ++talkId.current;
    const a = pro.current;
    if (!a) {
      setLine(text);
      hideTimer.current = setTimeout(() => setLine(null), 3600);
      return;
    }
    setLine("…");
    a.say(text, {
      gesture,
      onWord: (soFar) => {
        if (talkId.current === id) setLine(soFar);
      },
    }).then(() => {
      if (talkId.current !== id) return;
      setLine(text);
      hideTimer.current = setTimeout(() => {
        if (talkId.current === id) {
          setLine(null);
          setAsked(-1);
        }
      }, 2600);
    });
  }, []);

  const say = useCallback(() => {
    const text = avatarLines[lineIdx.current % avatarLines.length];
    lineIdx.current += 1;
    speak(text);
  }, [speak]);

  const ask = useCallback(
    (i: number) => {
      setAsked(i);
      speak(avatarQA[i].a, avatarQA[i].gesture);
    },
    [speak]
  );

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
          withAvatar: !avatarModel,
          dark: true,
        })
      ),
    { eager: true }
  );

  // The rigged avatar model, when one is configured, loads alongside.
  useEffect(() => {
    const el = avatarRef.current;
    if (!avatarModel || !el || !shouldUse3D()) return;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("../three/proAvatar")
      .then(({ createProAvatar }) =>
        createProAvatar(el, avatarModel!, {
          bubbleEl: bubbleRef.current,
          reduced,
          onClick: () => say(),
        })
      )
      .then((a) => {
        if (cancelled) return a.dispose();
        pro.current = a;
        setProReady(true);
      })
      .catch((err) => console.error("Avatar failed to load", err));
    return () => {
      cancelled = true;
      pro.current?.dispose();
      pro.current = null;
    };
  }, [say]);

  // As the layers snap together on scroll, the avatar turns to watch.
  useEffect(() => {
    if (!proReady) return;
    const onScroll = () => {
      const p = progress.current;
      if (p > 0.3 && p < 0.98 && scene.current) {
        const s = scene.current.stackOnScreen();
        pro.current?.lookAtPoint(s.x, s.y, 1200);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [proReady, progress, scene]);

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

  const ready = avatarModel ? proReady : state === "ready";
  const wave = useCallback(() => {
    if (avatarModel) ask(0);
    else scene.current?.wave();
  }, [ask, scene]);

  // The avatar introduces itself once it is up.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (window.scrollY < 80) wave();
    }, 1200);
    return () => clearTimeout(t);
  }, [ready, wave]);

  const current = layer >= 0 ? layers[layer] : null;

  return (
    <section className={`hero ${avatarModel ? "hero--pro" : ""}`} id="top" ref={sectionRef} aria-label="Introduction">
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
        {avatarModel && (
          <div
            className={`hero__avatar ${proReady ? "is-ready" : ""}`}
            ref={avatarRef}
            role="img"
            aria-label="3D avatar of Nirbyoleek. Click to hear a line."
          />
        )}
        {/* A still of the avatar: the whole view on light devices, and a
            placeholder elsewhere until the 3D avatar is ready. */}
        <img
          className={`hero__still ${ready ? "is-hidden" : ""} ${state === "lite" ? "is-lite" : ""}`}
          src={STILL}
          width="720"
          height="900"
          alt="Avatar of Nirbyoleek"
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
          </ul>
          <p className="hero__role">
            <strong>{person.role}.</strong> {person.headline}
          </p>
          <div className="hero__actions">
            <a
              className="btn btn--primary"
              href={`./${person.resume}`}
              download
              data-magnetic
              onClick={() => pro.current?.thumbsUp()}
            >
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

        {ready && avatarModel && (
          <div className="hero__ask" role="group" aria-label="Ask my avatar">
            <span className="hero__ask-label">Ask me</span>
            {avatarQA.map((x, i) => (
              <button
                key={x.q}
                className={`chip ${asked === i ? "is-on" : ""}`}
                onClick={() => ask(i)}
                aria-pressed={asked === i}
              >
                {x.q}
              </button>
            ))}
          </div>
        )}

        <div className={`hero__caption ${current ? "is-on" : ""}`} aria-live="polite">
          {current && (
            <>
              <strong>{current.name}</strong>
              <span>{current.line}</span>
            </>
          )}
        </div>

        {ready && !avatarModel && (
          <p className="hero__hint">
            <button className="link-btn" onClick={wave}>
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
