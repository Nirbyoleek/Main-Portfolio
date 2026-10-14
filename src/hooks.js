import { useEffect, useRef, useState } from "react";

let webglOk = null;
export function hasWebGL() {
  if (webglOk !== null) return webglOk;
  try {
    const c = document.createElement("canvas");
    webglOk = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    webglOk = false;
  }
  return webglOk;
}

// Fonts must be ready before canvases draw text into textures.
const fontsReady =
  typeof document !== "undefined" && document.fonts
    ? Promise.race([
        Promise.all([
          document.fonts.load("800 40px Archivo"),
          document.fonts.load("500 40px Archivo"),
        ]).then(() => document.fonts.ready),
        new Promise((r) => setTimeout(r, 2500)),
      ])
    : Promise.resolve();

/**
 * Mounts a three.js scene into the returned ref once the element is near
 * the viewport (so the page doesn't create every WebGL context at load),
 * and disposes it on unmount. `create(el)` returns an object with dispose().
 */
export function useScene(create, { eager = false } = {}) {
  const ref = useRef(null);
  const api = useRef(null);
  const [state, setState] = useState(hasWebGL() ? "idle" : "unsupported");

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasWebGL()) return;
    let disposed = false;
    let io;
    const mount = async () => {
      await fontsReady;
      if (disposed || api.current) return;
      try {
        api.current = create(el);
        setState("ready");
      } catch (err) {
        console.error(err);
        setState("unsupported");
      }
    };
    if (eager) mount();
    else {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io.disconnect();
            mount();
          }
        },
        { rootMargin: "600px 0px" }
      );
      io.observe(el);
    }
    return () => {
      disposed = true;
      io?.disconnect();
      api.current?.dispose();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, api, state];
}

/** Scroll progress (0..1) of an element through its own scroll length. */
export function useScrollProgress(ref) {
  const progress = useRef(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      progress.current = Math.min(1, Math.max(0, -r.top / span));
      el.style.setProperty("--p", progress.current.toFixed(3));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return progress;
}
