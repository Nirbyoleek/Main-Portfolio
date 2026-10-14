// A turntable of project screens. Flick it and it keeps spinning, then
// springs to the nearest screen; click a screen to bring it round. The
// front screen pops forward and leans toward the cursor, and every screen
// leans into the spin while the turntable is moving.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, prefersReducedMotion } from "./stage";
import type { SceneHandle } from "./stage";
import { makeContactShadow, makeProjectTexture, PROJECT_ASPECT } from "./textures";
import { spring, stepSpring, wrap } from "../lib/math";
import { C } from "./palette";

export interface ProjectsScene extends SceneHandle {
  setIndex: (i: number, notify?: boolean) => void;
}

export function createProjectsScene(
  container: HTMLElement,
  { projects, onSelect }: { projects: { mock: string }[]; onSelect?: (i: number) => void }
): ProjectsScene {
  const reduced = prefersReducedMotion();
  let radius = 3.4;
  let camZ = 8.6;

  const stage = createStage(container, {
    fov: 30,
    onFrame: (dt, t) => frame(dt, t),
    onResize: ({ aspect }) => {
      // Narrow screens: pull the camera back so the front screen fits.
      camZ = aspect < 0.8 ? 15.5 : aspect < 1.4 ? 12.2 : 11.2;
      radius = aspect < 0.8 ? 3.0 : 3.4;
    },
  });
  const { scene, camera, renderer, pointer } = stage;

  scene.add(new THREE.HemisphereLight(C.paperHi, C.mist, 0.85));
  const key = new THREE.DirectionalLight("#ffffff", 2);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.cobaltSoft, 0.9);
  rim.position.set(5, 3, -6);
  scene.add(rim);

  // Turntable: a glossy platter with a cobalt rim and a soft shadow.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.3, 4.4, 0.16, 96),
    new THREE.MeshPhysicalMaterial({ color: C.paperHi, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.25 })
  );
  base.position.y = -1.42;
  scene.add(base);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.36, 0.03, 8, 160),
    new THREE.MeshStandardMaterial({ color: C.cobalt, roughness: 0.3, emissive: C.cobalt, emissiveIntensity: 0.25 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.34;
  scene.add(ring);
  const shadow = makeContactShadow(0.3);
  shadow.scale.set(11, 11, 1);
  shadow.position.y = -1.51;
  scene.add(shadow);

  const carousel = new THREE.Group();
  scene.add(carousel);

  const W = 2.7;
  const H = W / PROJECT_ASPECT;
  const n = projects.length;
  const step = (Math.PI * 2) / n;
  const frameGeo = new RoundedBoxGeometry(W + 0.14, H + 0.14, 0.09, 3, 0.08);
  const screenGeo = new THREE.PlaneGeometry(W, H);
  const standGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 12);
  const frameMat = new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.3, clearcoat: 0.7 });
  const standMat = new THREE.MeshStandardMaterial({ color: C.ink });

  const panels = projects.map((p, i) => {
    const holder = new THREE.Group(); // placed on the ring
    const lean = new THREE.Group(); // pops, tilts and leans
    holder.add(lean);
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    const screen = new THREE.Mesh(
      screenGeo,
      new THREE.MeshBasicMaterial({ map: makeProjectTexture(p, renderer), toneMapped: false, transparent: true })
    );
    screen.position.z = 0.05;
    screen.userData.index = i;
    frameMesh.userData.index = i;
    lean.add(frameMesh, screen);
    const stand = new THREE.Mesh(standGeo, standMat);
    holder.add(stand);
    const foot = makeContactShadow(0.22);
    foot.scale.set(W * 0.9, 0.7, 1);
    foot.position.set(0, -1.335, 0);
    holder.add(foot);
    carousel.add(holder);
    return { holder, lean, screen, frameMesh, stand, pop: spring(0), hover: spring(0) };
  });
  const hitList = panels.flatMap((p) => [p.screen, p.frameMesh]);

  let index = 0;
  const angle = spring(0); // carousel rotation
  let target = 0;
  let hoverIndex = -1;
  let drag: { x: number; moved: number; last: number; t: number; v: number } | null = null;

  const setIndex = (i: number, notify = true) => {
    // Choose the rotation closest to the current angle that shows panel i.
    const base = -i * step;
    const k = Math.round((angle.x - base) / (Math.PI * 2));
    target = base + k * Math.PI * 2;
    index = wrap(i, n);
    if (reduced) {
      angle.x = target;
      angle.v = 0;
    }
    if (notify) onSelect?.(index);
  };

  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.style.cursor = "grab";
  const toAngle = (dx: number) => (dx / Math.max(1, container.clientWidth)) * Math.PI * 1.4;

  const onDown = (e: PointerEvent) => {
    drag = { x: e.clientX, moved: 0, last: e.clientX, t: performance.now(), v: 0 };
    angle.v = 0;
    el.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    if (drag) {
      const now = performance.now();
      const da = toAngle(e.clientX - drag.last);
      drag.moved += Math.abs(e.clientX - drag.last);
      // Track the flick speed (radians per second), smoothed.
      const inst = da / Math.max(0.008, (now - drag.t) / 1000);
      drag.v = drag.v * 0.6 + inst * 0.4;
      drag.last = e.clientX;
      drag.t = now;
      angle.x += da;
      target = angle.x;
      return;
    }
    if (e.pointerType === "touch") return;
    const hit = stage.pick(e.clientX, e.clientY, hitList)[0];
    hoverIndex = hit ? (hit.object.userData.index as number) : -1;
    el.style.cursor = hit ? "pointer" : "grab";
  };
  const onUp = (e: PointerEvent) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    el.style.cursor = "grab";
    if (d.moved < 6) {
      const hit = stage.pick(e.clientX, e.clientY, hitList)[0];
      if (hit) setIndex(hit.object.userData.index as number);
      return;
    }
    // Let the flick carry, then settle on whichever screen it lands near.
    const carry = THREE.MathUtils.clamp(d.v, -14, 14) * 0.22;
    angle.v = THREE.MathUtils.clamp(d.v, -14, 14);
    const landing = angle.x + carry;
    setIndex(Math.round(-landing / step));
  };
  const onLeave = () => {
    hoverIndex = -1;
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  function frame(dt: number, t: number) {
    camera.position.set(pointer.sx * 0.35, 1.9 + pointer.sy * 0.25, camZ);
    camera.lookAt(0, 0.1, radius * 0.7);

    // Under-damped, so a snap overshoots a touch and settles.
    if (!drag) stepSpring(angle, target, reduced ? 400 : 34, reduced ? 40 : 9, dt);
    carousel.rotation.y = angle.x;
    const spin = THREE.MathUtils.clamp(angle.v, -6, 6);

    panels.forEach((p, i) => {
      const a = i * step;
      p.holder.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
      p.holder.rotation.y = a;
      const facing = Math.cos(a + angle.x); // 1 when facing the camera
      const pop = stepSpring(p.pop, i === index && !drag ? 1 : 0, 180, 14, dt);
      const hov = stepSpring(p.hover, i === hoverIndex && i !== index ? 1 : 0, 220, 18, dt);
      const s = 0.7 + Math.max(0, facing) * 0.3 + pop * 0.04 + hov * 0.03;
      p.lean.scale.setScalar(s);
      const bob = reduced ? 0 : Math.sin(t * 1.1 + i) * 0.035;
      p.lean.position.y = 0.05 + bob + pop * 0.14 + hov * 0.08;
      p.lean.position.z = pop * 0.25;
      // Front screen follows the cursor; every screen leans into the spin.
      p.lean.rotation.y = pop * pointer.sx * 0.26 - spin * 0.06;
      p.lean.rotation.x = pop * -pointer.sy * 0.14;
      p.lean.rotation.z = -spin * 0.015;
      p.stand.scale.y = 1.35 + p.lean.position.y;
      p.stand.position.y = -1.34 + p.stand.scale.y / 2;
      p.stand.position.z = -0.1;
      const dim = 0.45 + Math.max(0, facing) * 0.55;
      p.screen.material.color.setScalar(Math.min(1, dim + hov * 0.1));
      p.screen.material.opacity = damp(p.screen.material.opacity, facing < -0.2 ? 0.25 : 1, 10, dt);
    });
  }

  setIndex(0, false);

  return {
    setIndex,
    dispose() {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stage.dispose();
    },
  };
}
