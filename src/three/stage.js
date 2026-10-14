import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/**
 * A small wrapper around a WebGL renderer bound to one DOM container.
 * It sizes itself to the container, only renders while the container is
 * on screen, and tracks the pointer in normalised coordinates.
 */
export function createStage(container, { fov = 35, onFrame, onResize } = {}) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  const maxDpr = isCoarsePointer() ? 1.6 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral keeps the cobalt from drifting to lavender (falls back on old three).
  renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  // A soft studio fill; kept low so the saturated cobalt stays saturated.
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

  // Pointer: x/y in -1..1 over the canvas, plus whether it is inside.
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, inside: false, down: false };
  const onMove = (e) => {
    const r = container.getBoundingClientRect();
    // Clamped, so a cursor far outside the canvas only tilts things a little.
    pointer.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.2, 1.2);
    pointer.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1.2, 1.2);
    pointer.inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let width = 1;
  let height = 1;
  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
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

  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: "120px" }
  );
  io.observe(container);

  let raf = 0;
  const t0 = performance.now();
  let last = t0;
  let elapsed = 0;
  const loop = (now = performance.now()) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(Math.max(0, (now - last) / 1000), 0.1);
    last = now;
    elapsed += dt;
    if (!visible || document.hidden) return;
    // Smoothed pointer so everything that follows it eases.
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 6);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 6);
    onFrame?.(dt, elapsed);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  /** Objects under a client-space point. */
  const pick = (clientX, clientY, objects) => {
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
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => {
        Object.values(m).forEach((v) => v?.isTexture && v.dispose());
        m.dispose();
      });
    });
    scene.environment?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    renderer,
    scene,
    camera,
    pointer,
    pick,
    dispose,
    get size() {
      return { width, height };
    },
  };
}

/** Frame-rate independent exponential smoothing. */
export const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
