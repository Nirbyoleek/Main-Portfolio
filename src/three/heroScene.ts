// The hero: an interface taken apart into its layers, floating on the
// stage. Scrolling collapses the layers back into one finished screen;
// dragging spins the stack; hovering springs a layer up with a light sweep
// across it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, clamp, smoothstep, prefersReducedMotion } from "./stage";
import type { SceneHandle } from "./stage";
import { makeLayerTexture, makeScreenTexture, makeSweepTexture, LAYER_ASPECT } from "./textures";
import { spring, stepSpring, type Spring } from "../lib/math";
import { C } from "./palette";

export interface HeroLayer {
  key: string;
  name: string;
}

export interface HeroSceneOptions {
  layers: HeroLayer[];
  getProgress: () => number;
  onLayer?: (index: number) => void;
  /** Lit for a dark backdrop: brighter glass edges and a stronger rim. */
  dark?: boolean;
}

export interface HeroScene extends SceneHandle {
  highlight: (index: number) => void;
}

interface Layout {
  cam: THREE.Vector3;
  camNear: THREE.Vector3;
  target: THREE.Vector3;
  stack: THREE.Vector3;
  stackScale: number;
}

interface LayerObj {
  g: THREE.Group;
  art: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  glass: THREE.Mesh<RoundedBoxGeometry, THREE.MeshStandardMaterial>;
  sweep: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  lift: Spring;
  intro: Spring;
  delay: number;
  sweepT: number;
}

export function createHeroScene(container: HTMLElement, opts: HeroSceneOptions): HeroScene {
  const { layers, getProgress, onLayer, dark = false } = opts;
  const reduced = prefersReducedMotion();

  let layout: Layout | null = null;
  const stage = createStage(container, {
    fov: 30,
    onFrame: (dt, t) => frame(dt, t),
    onResize: ({ aspect }) => {
      layout = computeLayout(aspect);
    },
  });
  const { scene, camera, renderer, pointer } = stage;

  /* Lights ----------------------------------------------------------- */
  scene.add(new THREE.HemisphereLight(C.paperHi, dark ? C.cobaltSoft : C.mist, dark ? 1.1 : 0.85));
  const key = new THREE.DirectionalLight("#ffffff", dark ? 2.4 : 2.1);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.cobaltSoft, dark ? 2.4 : 1.5);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  // A cool fill in front of the stack, as if the screens glow.
  const screenLight = new THREE.PointLight(C.cobaltSoft, 1.2, 9, 1.6);
  scene.add(screenLight);

  /* Layer stack ------------------------------------------------------ */
  const stack = new THREE.Group(); // positioned by layout
  const spinG = new THREE.Group(); // user drag + pointer tilt
  const tilt = new THREE.Group(); // exploded ↔ flat rotation
  stack.add(spinG);
  spinG.add(tilt);
  scene.add(stack);

  const LW = 2.5;
  const LH = LW / LAYER_ASPECT;
  const layerGeo = new THREE.PlaneGeometry(LW, LH);
  const glassGeo = new RoundedBoxGeometry(LW, LH, 0.02, 3, 0.06);
  const sweepGeo = new THREE.PlaneGeometry(LW * 0.22, LH);
  const sweepTex = makeSweepTexture();

  const layerObjs: LayerObj[] = layers.map((l, i) => {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(
      glassGeo,
      new THREE.MeshStandardMaterial({
        color: C.paperHi,
        transparent: true,
        opacity: i === 0 ? 0.92 : 0.38,
        roughness: 0.1,
        depthWrite: false,
      })
    );
    const art = new THREE.Mesh(
      layerGeo,
      new THREE.MeshBasicMaterial({
        map: makeLayerTexture(l.key, renderer),
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    art.position.z = 0.012;
    art.userData.index = i;
    // A soft band of light that sweeps across a lifted layer.
    const sweep = new THREE.Mesh(
      sweepGeo,
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        alphaMap: sweepTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    );
    sweep.position.z = 0.02;
    g.add(glass, art, sweep);
    glass.renderOrder = i * 3;
    art.renderOrder = i * 3 + 1;
    sweep.renderOrder = i * 3 + 2;
    tilt.add(g);
    return {
      g,
      art,
      glass,
      sweep,
      lift: spring(0),
      intro: spring(reduced ? 1 : 0),
      delay: reduced ? 0 : 0.35 + i * 0.11,
      sweepT: 1,
    };
  });
  const arts = layerObjs.map((o) => o.art);

  // The finished screen + bezel appear once the layers have collapsed.
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(LW + 0.16, LH + 0.16, 0.08, 3, 0.07),
    new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.3, clearcoat: 0.8, transparent: true, opacity: 0 })
  );
  bezel.position.z = -0.06;
  tilt.add(bezel);
  const finished = new THREE.Mesh(
    layerGeo,
    new THREE.MeshBasicMaterial({ map: makeScreenTexture(renderer), transparent: true, opacity: 0, toneMapped: false })
  );
  tilt.add(finished);

  /* Layout per aspect ratio ----------------------------------------- */
  function computeLayout(aspect: number): Layout {
    if (aspect < 0.78) {
      // Phones: the stack sits in the middle, between the name and the buttons.
      return {
        cam: new THREE.Vector3(0, 2.4, 11.6),
        camNear: new THREE.Vector3(0, 2.0, 10.6),
        target: new THREE.Vector3(0, 0.2, 0),
        stack: new THREE.Vector3(0, 0.1, 0),
        stackScale: 0.76,
      };
    }
    if (aspect < 1.25) {
      return {
        cam: new THREE.Vector3(0, 1.0, 10.4),
        camNear: new THREE.Vector3(0, 1.2, 8.4),
        target: new THREE.Vector3(0.2, 0.7, 0),
        stack: new THREE.Vector3(1.0, 0.9, 0),
        stackScale: 0.95,
      };
    }
    // Wide screens: text on the left, the stack is the subject on the right.
    return {
      cam: new THREE.Vector3(-0.4, 2.7, 10.2),
      camNear: new THREE.Vector3(0.2, 2.1, 9.0),
      target: new THREE.Vector3(-0.7, 0.75, 0),
      stack: new THREE.Vector3(0.75, 0.3, 0),
      stackScale: 1.08,
    };
  }
  layout = layout || computeLayout(camera.aspect);

  /* Interaction ------------------------------------------------------ */
  const el = renderer.domElement;
  let hovered = -1;
  let selected = -1;
  let drag: { x: number; t: number; moved: number } | null = null;
  const yaw = spring(0);
  let yawTarget = 0;

  const pickLayer = (x: number, y: number): number => {
    const hit = stage.pick(x, y, arts)[0];
    return hit ? (hit.object.userData.index as number) : -1;
  };

  const lift = (i: number) => {
    const o = layerObjs[i];
    if (!o || reduced) return;
    o.lift.v += 6; // a little pop on arrival
    o.sweepT = 0; // and a light sweep
  };

  const onPointerMove = (e: PointerEvent) => {
    if (drag) {
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.moved += Math.abs(dx);
      const v = (dx / Math.max(1, container.clientWidth)) * 5.5;
      yawTarget += v;
      yaw.x += v;
      return;
    }
    if (e.pointerType === "touch") return;
    const i = pickLayer(e.clientX, e.clientY);
    if (i !== hovered) {
      hovered = i;
      if (i >= 0) lift(i);
      onLayer?.(i >= 0 ? i : selected);
    }
    el.style.cursor = i >= 0 ? "pointer" : "grab";
  };
  const onPointerDown = (e: PointerEvent) => {
    drag = { x: e.clientX, t: performance.now(), moved: 0 };
    el.style.cursor = "grabbing";
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!drag) return;
    const tapped = drag.moved < 6;
    drag = null;
    el.style.cursor = "grab";
    yawTarget = 0; // the stack springs back to its resting angle
    if (!tapped) return;
    const i = pickLayer(e.clientX, e.clientY);
    selected = i === selected ? -1 : i;
    if (selected >= 0) lift(selected);
    onLayer?.(selected);
  };
  const onLeave = () => {
    hovered = -1;
    onLayer?.(selected);
  };
  el.style.touchAction = "pan-y";
  el.style.cursor = "grab";
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("pointerleave", onLeave);

  /* Frame ------------------------------------------------------------ */
  const camPos = new THREE.Vector3();
  const camX = spring(0);
  const camY = spring(0);
  const tiltY = spring(0);
  const tiltX = spring(0);
  let introT = 0;
  let smoothP = 0;

  function frame(dt: number, t: number) {
    introT += dt;
    const L = layout ?? computeLayout(camera.aspect);
    smoothP = reduced ? clamp(getProgress()) : damp(smoothP, clamp(getProgress()), 8, dt);
    const p = smoothstep(0.08, 0.85, smoothP);

    // Camera: dolly in as the layers collapse, with a springy parallax.
    camPos.lerpVectors(L.cam, L.camNear, p);
    camPos.x += stepSpring(camX, pointer.sx * 0.3, 40, 11, dt);
    camPos.y += stepSpring(camY, pointer.sy * 0.15, 40, 11, dt);
    camera.position.copy(camPos);
    camera.lookAt(L.target);

    // Stack placement.
    stack.position.copy(L.stack);
    stack.scale.setScalar(L.stackScale * (1 + p * 0.08));
    screenLight.position.set(L.stack.x + 0.4, L.stack.y - 0.2, L.stack.z + 1.4);

    // Drag springs back; the pointer tilts the stack, also on springs.
    if (!drag) stepSpring(yaw, yawTarget, 26, 7, dt);
    const idle = reduced ? 0 : Math.sin(t * 0.35) * 0.05 * (1 - p);
    spinG.rotation.y = yaw.x + stepSpring(tiltY, pointer.sx * 0.22 * (1 - p * 0.6), 50, 10, dt) + idle;
    spinG.rotation.x = stepSpring(tiltX, -pointer.sy * 0.12 * (1 - p * 0.5), 50, 10, dt);

    // Exploded (isometric) → flat screen
    tilt.rotation.x = THREE.MathUtils.lerp(-0.95, -0.12, p);
    tilt.rotation.z = THREE.MathUtils.lerp(0.62, 0, p);
    tilt.rotation.y = THREE.MathUtils.lerp(0, -0.32, p);

    const gap = THREE.MathUtils.lerp(0.42, 0.004, p);
    const active = hovered >= 0 ? hovered : selected;
    layerObjs.forEach((o, i) => {
      // Intro: each layer springs up into place, one after another.
      if (introT > o.delay) stepSpring(o.intro, 1, 90, 11, dt);
      const lift = stepSpring(o.lift, i === active ? 1 : 0, 170, 15, dt);
      const bob = reduced ? 0 : Math.sin(t * 1.2 + i * 0.9) * 0.025 * (1 - p);
      o.g.position.z = i * gap + lift * 0.24 * (1 - p) + bob - (1 - o.intro.x) * 2.2;
      o.g.position.x = lift * 0.08 * (1 - p);
      const shown = clamp(o.intro.x * 1.4);
      // Layers other than the one in focus fade back a little.
      const focusDim = active >= 0 && i !== active ? 0.55 : 1;
      const vis = shown * (1 - smoothstep(0.82, 0.98, p) * 0.9);
      o.art.material.opacity = damp(o.art.material.opacity, vis * focusDim, 14, dt);
      o.glass.material.opacity = (i === 0 ? 0.92 : 0.38) * vis * (1 - p * 0.5);
      // Sweep of light across the layer that just lifted.
      if (o.sweepT < 1) {
        o.sweepT = Math.min(1, o.sweepT + dt * 1.6);
        o.sweep.position.x = THREE.MathUtils.lerp(-LW * 0.62, LW * 0.62, o.sweepT);
        o.sweep.material.opacity = Math.sin(o.sweepT * Math.PI) * 0.55 * (1 - p);
      } else {
        o.sweep.material.opacity = 0;
      }
    });
    const done = smoothstep(0.72, 0.96, p);
    finished.material.opacity = done;
    finished.position.z = layers.length * gap + 0.02;
    bezel.material.opacity = done;
    bezel.visible = done > 0.01;

  }

  return {
    highlight(i: number) {
      if (i >= 0 && i !== selected) lift(i);
      selected = i;
    },
    dispose() {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onLeave);
      stage.dispose();
    },
  };
}
