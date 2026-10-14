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
