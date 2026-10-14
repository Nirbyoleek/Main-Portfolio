import { useEffect, useRef, useState, type RefObject } from "react";
import type { SceneHandle } from "./three/stage";

let webglOk: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglOk !== null) return webglOk;
  try {
    const c = document.createElement("canvas");
    webglOk = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    webglOk = false;
  }
  return webglOk;
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Whether this device should get the 3D scenes. Low-memory or low-core
 * devices, data-saver mode, 2G connections and `?lite` in the URL get the
 * static version instead, which loads no three.js at all.
 */
export function shouldUse3D(): boolean {
  if (typeof window === "undefined" || !hasWebGL()) return false;
  if (new URLSearchParams(window.location.search).has("lite")) return false;
  const nav = navigator as Navigator & { connection?: NetworkInformationLike; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4 && nav.deviceMemory !== undefined && nav.deviceMemory <= 2)
    return false;
  return true;
}

// Fonts must be ready before canvases draw text into textures.
const fontsReady: Promise<unknown> =
  typeof document !== "undefined" && document.fonts
    ? Promise.race([
        Promise.all([document.fonts.load("800 40px Archivo"), document.fonts.load("500 40px Archivo")]).then(
          () => document.fonts.ready
        ),
        new Promise((r) => setTimeout(r, 2500)),
      ])
    : Promise.resolve();

/** `loading` → fetching three.js; `lite` → device gets the static version. */
export type SceneState = "idle" | "loading" | "ready" | "lite";

/**
 * Lazily loads a three.js scene into the returned ref once the element is
 * near the viewport. `load` dynamically imports the scene module, so three.js
 * is a separate chunk that never blocks the first paint, and is skipped
 * entirely on devices that get the static version.
 */
export function useScene<T extends SceneHandle>(
  load: () => Promise<(el: HTMLElement) => T>,
  { eager = false }: { eager?: boolean } = {}
): [RefObject<HTMLDivElement | null>, RefObject<T | null>, SceneState] {
  const ref = useRef<HTMLDivElement | null>(null);
  const api = useRef<T | null>(null);
  const [state, setState] = useState<SceneState>(() => (shouldUse3D() ? "idle" : "lite"));

  useEffect(() => {
    const el = ref.current;
    if (!el || state === "lite") return;
    let disposed = false;
    let io: IntersectionObserver | undefined;

    const mount = async () => {
      setState("loading");
      try {
        const [create] = await Promise.all([load(), fontsReady]);
        if (disposed || api.current) return;
        api.current = create(el);
        setState("ready");
      } catch (err) {
        console.error(err);
        if (!disposed) setState("lite");
      }
    };

    if (eager) {
      // Let the text paint first, then start fetching three.js.
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      if (idle) idle(() => void mount(), { timeout: 600 });
      else setTimeout(() => void mount(), 120);
    } else {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io?.disconnect();
            void mount();
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
    // The loader is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, api, state];
}

/** Scroll progress (0..1) of an element through its own scroll length. */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): RefObject<number> {
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
