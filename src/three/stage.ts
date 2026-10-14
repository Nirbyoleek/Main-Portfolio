import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clamp } from "../lib/math";

export { damp, clamp, smoothstep } from "../lib/math";

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isCoarsePointer = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Pointer in -1..1 over the canvas; `sx`/`sy` are smoothed copies. */
export interface Pointer {
  x: number;
  y: number;
  sx: number;
  sy: number;
  inside: boolean;
}

export interface StageOptions {
  fov?: number;
  onFrame?: (dt: number, elapsed: number) => void;
  onResize?: (size: { width: number; height: number; aspect: number }) => void;
}

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pointer: Pointer;
  pick: (clientX: number, clientY: number, objects: THREE.Object3D[]) => THREE.Intersection[];
  dispose: () => void;
}

/** Anything a scene module returns to React. */
export interface SceneHandle {
  dispose: () => void;
}

/**
 * A small wrapper around a WebGL renderer bound to one DOM container.
 * It sizes itself to the container, only renders while the container is
 * on screen, and tracks the pointer in normalised coordinates.
 */
export function createStage(container: HTMLElement, { fov = 35, onFrame, onResize }: StageOptions = {}): Stage {
  const coarse = isCoarsePointer();
  const renderer = new THREE.WebGLRenderer({
    antialias: !coarse || (window.devicePixelRatio || 1) < 2,
    alpha: true,
    powerPreference: "high-performance",
  });
  // Resolution adapts to how fast this device renders (see the loop below).
  // Phones already have dense screens, so they start lower.
  const maxDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  let dpr = maxDpr;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral keeps the cobalt from drifting to lavender.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  // No shadow maps: scenes use soft contact-shadow decals instead, which
  // look softer and cost one textured quad rather than extra render passes.
  renderer.shadowMap.enabled = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  // A soft studio fill; kept low so the saturated cobalt stays saturated.
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

  const pointer: Pointer = { x: 0, y: 0, sx: 0, sy: 0, inside: false };
  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    // Clamped, so a cursor far outside the canvas only tilts things a little.
    pointer.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.2, 1.2);
    pointer.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1.2, 1.2);
    pointer.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    onResize?.({ width, height, aspect: camera.aspect });
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Only render while on screen and while the tab is visible.
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: "120px" }
  );
  io.observe(container);

  // Adaptive resolution: if frames run slow, render fewer pixels; if they
  // run fast for a while, step back up. Keeps motion smooth on weak GPUs.
  let frameMs = 16;
  let slowFor = 0;
  let fastFor = 0;
  const adapt = (ms: number, dt: number) => {
    frameMs += (ms - frameMs) * 0.08;
    slowFor = frameMs > 24 ? slowFor + dt : 0;
    fastFor = frameMs < 14 ? fastFor + dt : 0;
    if (slowFor > 0.6 && dpr > 0.75) {
      dpr = Math.max(0.75, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
      slowFor = 0;
    } else if (fastFor > 3 && dpr < maxDpr) {
      dpr = Math.min(maxDpr, dpr + 0.25);
      renderer.setPixelRatio(dpr);
      resize();
      fastFor = 0;
    }
  };

  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let wasVisible = true;
  const loop = (now: number = performance.now()) => {
    raf = requestAnimationFrame(loop);
    const ms = now - last;
    const dt = Math.min(Math.max(0, ms / 1000), 0.1);
    last = now;
    if (!visible || document.hidden) {
      wasVisible = false;
      return;
    }
    // Coming back on screen: don't count the time spent hidden.
    if (!wasVisible) {
      wasVisible = true;
      return;
    }
    elapsed += dt;
    adapt(ms, dt);
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 6);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 6);
    onFrame?.(dt, elapsed);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (clientX: number, clientY: number, objects: THREE.Object3D[]) => {
    const r = container.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(objects, true);
  };

  const dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.geometry.dispose();
      const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        Object.values(m).forEach((v: unknown) => {
          if (v instanceof THREE.Texture) v.dispose();
        });
        m.dispose();
      });
    });
    scene.environment?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { renderer, scene, camera, pointer, pick, dispose };
}
