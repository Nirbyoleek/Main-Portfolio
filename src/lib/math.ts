// Small numeric helpers shared by the 3D scenes. Pure, so they are unit tested.

/** Frame-rate independent exponential smoothing toward `target`. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));

/** Hermite smoothstep: 0 below `a`, 1 above `b`, eased in between. */
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Wraps an index into 0..n-1, including negative values. */
export const wrap = (i: number, n: number): number => ((i % n) + n) % n;

/** A damped spring's moving parts: position and velocity. */
export interface Spring {
  x: number;
  v: number;
}

/**
 * Advances a damped spring toward `target`. Stiffness sets how quickly it
 * pulls, damping how much it resists; below critical damping
 * (2·√stiffness) it overshoots and settles, which reads as "physical".
 * Sub-stepped so a long frame doesn't make it explode.
 */
export function stepSpring(s: Spring, target: number, stiffness: number, damping: number, dt: number): number {
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const a = stiffness * (target - s.x) - damping * s.v;
    s.v += a * h;
    s.x += s.v * h;
  }
  return s.x;
}

export const spring = (x = 0): Spring => ({ x, v: 0 });
