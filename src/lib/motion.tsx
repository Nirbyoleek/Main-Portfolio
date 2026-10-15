// Page motion: scroll reveals, count-up numbers and magnetic buttons.
// Everything here respects prefers-reduced-motion, and nothing is hidden
// before JavaScript runs: start states only apply under `html.motion-ok`.
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const reducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Marks motion as available and reveals `[data-reveal]` elements as they
 * scroll into view by adding `is-in`. Call once, near the root.
 */
export function useRevealOnScroll(): void {
  useEffect(() => {
    if (reducedMotion() || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("motion-ok");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    const watch = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    watch();
    // Sections render their content after data changes; pick up new nodes.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("motion-ok");
    };
  }, []);
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Renders a figure like "−40%", "2+", "9.5" or "20k/s" and counts the
 * number up from zero when it scrolls into view. Without motion it simply
 * shows the final text.
 */
export function CountUp({ value, duration = 1100 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const [shown, setShown] = useState(value);

  useLayoutEffect(() => {
    if (!match || reducedMotion() || !("IntersectionObserver" in window)) return;
    const el = ref.current;
    if (!el) return;
    const [, pre, num, post] = match;
    const target = parseFloat(num);
    const decimals = num.includes(".") ? num.split(".")[1].length : 0;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already on screen: leave as is
    setShown(`${pre}${(0).toFixed(decimals)}${post}`);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / duration);
          setShown(`${pre}${(target * easeOut(k)).toFixed(decimals)}${post}`);
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // Runs once per value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className="count" aria-label={value}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/**
 * Buttons marked `data-magnetic` lean a few pixels toward the cursor.
 * One delegated listener for the whole page; mouse and pen only.
 */
export function useMagneticButtons(): void {
  useEffect(() => {
    if (reducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    let current: HTMLElement | null = null;
    const reset = (el: HTMLElement) => {
      el.style.translate = "";
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.translate = `${(dx * 5).toFixed(1)}px ${(dy * 4).toFixed(1)}px`;
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);
}

/**
 * Cards marked `data-spot` get a soft light that follows the pointer
 * (the position is written to --sx/--sy; CSS draws the glow). One listener
 * for the whole page; nothing runs on touch screens.
 */
export function useSpotlight(): void {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const card = (e.target as Element | null)?.closest?.<HTMLElement>("[data-spot]");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty("--sy", `${(e.clientY - r.top).toFixed(0)}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}
