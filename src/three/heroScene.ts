// The hero: an interface taken apart into its layers, floating beside the
// desk of a small avatar. Scrolling collapses the layers back into one
// finished screen (the avatar turns to watch); dragging spins the stack;
// hovering springs a layer up with a light sweep across it; clicking the
// avatar makes it wave.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, clamp, smoothstep, prefersReducedMotion } from "./stage";
import type { Pointer, SceneHandle } from "./stage";
import { createAvatar } from "./avatar";
import { makeContactShadow, makeLayerTexture, makeScreenTexture, makeSweepTexture, LAYER_ASPECT } from "./textures";
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
  onAvatarClick?: () => void;
  bubbleEl?: HTMLElement | null;
  /**
   * Draw the built-in illustrated avatar at its desk. Off when a rigged
   * avatar model is shown separately (see proAvatar.ts).
   */
  withAvatar?: boolean;
  /** Lit for a dark backdrop: brighter glass edges and a stronger rim. */
  dark?: boolean;
}

export interface HeroScene extends SceneHandle {
  highlight: (index: number) => void;
  wave: () => void;
  /** Where the layer stack is on the page, in client pixels. */
  stackOnScreen: () => { x: number; y: number };
}

interface Layout {
  cam: THREE.Vector3;
  camNear: THREE.Vector3;
  target: THREE.Vector3;
  stack: THREE.Vector3;
  stackScale: number;
  avatar: THREE.Vector3;
  avatarRot: number;
  avatarScale: number;
  /** How far the stack moves when the rigged avatar is shown instead. */
  proShift: THREE.Vector3;
  /** Where the avatar looks (in pointer units) to watch the stack collapse. */
  watch: { x: number; y: number };
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

const GROUND = -1.18; // floor height in the avatar's own space

export function createHeroScene(container: HTMLElement, opts: HeroSceneOptions): HeroScene {
  const { layers, getProgress, onLayer, onAvatarClick, bubbleEl, withAvatar = true, dark = false } = opts;
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
  // A cool fill from the stack's side, as if the screens light the avatar.
  const screenLight = new THREE.PointLight(C.cobaltSoft, 1.2, 9, 1.6);
  scene.add(screenLight);

  /* Avatar ----------------------------------------------------------- */
  const avatar = withAvatar ? createAvatar() : null;
  if (avatar) {
    scene.add(avatar.root);
    const deskShadow = makeContactShadow(0.36);
    deskShadow.scale.set(3.3, 2.1, 1);
    deskShadow.position.set(0.05, GROUND + 0.005, 0.15);
    avatar.root.add(deskShadow);
  }

  /* Layer stack ------------------------------------------------------ */
  const stack = new THREE.Group(); // positioned by layout
  const spinG = new THREE.Group(); // user drag + pointer tilt
  const tilt = new THREE.Group(); // exploded ↔ flat rotation
  stack.add(spinG);
  spinG.add(tilt);
  scene.add(stack);
  const stackShadow = makeContactShadow(0.22);
  scene.add(stackShadow);

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
      // Phones: avatar centred, the stack floating up and to its right.
      return {
        cam: new THREE.Vector3(0, 2.4, 11.6),
        camNear: new THREE.Vector3(0, 2.0, 10.6),
        target: new THREE.Vector3(0, 0.2, 0),
        stack: new THREE.Vector3(0.9, 0.55, -1.4),
        stackScale: 0.46,
        avatar: new THREE.Vector3(0.2, -1.05, 0.9),
        avatarRot: -0.12,
        avatarScale: 1.0,
        proShift: new THREE.Vector3(0.1, -0.3, 0),
        watch: { x: 0.55, y: 0.6 },
      };
    }
    if (aspect < 1.25) {
      return {
        cam: new THREE.Vector3(0, 1.0, 10.4),
        camNear: new THREE.Vector3(0, 1.2, 8.4),
        target: new THREE.Vector3(0.2, 0.7, 0),
        stack: new THREE.Vector3(-0.2, 1.65, 0),
        stackScale: 0.9,
        avatar: new THREE.Vector3(1.45, -0.35, 0.6),
        avatarRot: -0.45,
        avatarScale: 1,
        proShift: new THREE.Vector3(1.1, -0.2, 0),
        watch: { x: -0.6, y: 0.6 },
      };
    }
    // Wide screens: the avatar is the subject on the right, with the
    // layers of its work floating above-left of the desk. Text on the left.
    return {
      cam: new THREE.Vector3(-0.4, 2.7, 10.2),
      camNear: new THREE.Vector3(0.2, 2.1, 9.0),
      target: new THREE.Vector3(-0.7, 0.75, 0),
      stack: new THREE.Vector3(0.7, 1.6, -1.0),
      stackScale: 0.78,
      avatar: new THREE.Vector3(2.35, -0.7, 0.8),
      avatarRot: -0.42,
      avatarScale: 1.18,
      proShift: new THREE.Vector3(1.25, -0.5, 0.3),
      watch: { x: -0.75, y: 0.55 },
    };
  }
  layout = layout || computeLayout(camera.aspect);

  /* Interaction ------------------------------------------------------ */
  const el = renderer.domElement;
  let hovered = -1;
  let selected = -1;
  let avatarHover = false;
  let drag: { x: number; t: number; moved: number } | null = null;
  const yaw = spring(0);
  let yawTarget = 0;

  const pickLayer = (x: number, y: number): number => {
    const hit = stage.pick(x, y, arts)[0];
    return hit ? (hit.object.userData.index as number) : -1;
  };
  const pickAvatar = (x: number, y: number) => !!avatar && stage.pick(x, y, avatar.hitTargets).length > 0;

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
    const a = i < 0 && pickAvatar(e.clientX, e.clientY);
    if (i !== hovered) {
      hovered = i;
      if (i >= 0) lift(i);
      onLayer?.(i >= 0 ? i : selected);
    }
    if (a !== avatarHover) {
      avatarHover = a;
      avatar?.setHover(a);
    }
    el.style.cursor = a || i >= 0 ? "pointer" : "grab";
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
    if (pickAvatar(e.clientX, e.clientY)) {
      avatar?.wave();
      onAvatarClick?.();
      return;
    }
    const i = pickLayer(e.clientX, e.clientY);
    selected = i === selected ? -1 : i;
    if (selected >= 0) lift(selected);
    onLayer?.(selected);
  };
  const onLeave = () => {
    hovered = -1;
    avatarHover = false;
    avatar?.setHover(false);
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
  const tmp = new THREE.Vector3();
  const camX = spring(0);
  const camY = spring(0);
  const tiltY = spring(0);
  const tiltX = spring(0);
  // What the avatar looks at: the cursor, turning to the stack as it closes.
  const gaze: Pointer = { x: 0, y: 0, sx: 0, sy: 0, inside: false };
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

    // Avatar
    if (avatar) {
      avatar.root.position.copy(L.avatar);
      avatar.root.rotation.y = L.avatarRot;
      avatar.root.scale.setScalar(L.avatarScale);
    }
    const w = smoothstep(0.15, 0.6, p);
    gaze.x = gaze.sx = THREE.MathUtils.lerp(pointer.sx, L.watch.x, w);
    gaze.y = gaze.sy = THREE.MathUtils.lerp(pointer.sy, L.watch.y, w);
    gaze.inside = pointer.inside;
    avatar?.update(dt, t, gaze, { reduced });

    // Stack placement, with its shadow on the floor below. Without the
    // desk avatar the stack shifts toward the middle, clear of the model.
    stack.position.copy(L.stack);
    if (!withAvatar) stack.position.add(L.proShift);
    stack.scale.setScalar(L.stackScale * (1 + p * 0.08));
    const floorY = L.avatar.y + GROUND * L.avatarScale;
    stackShadow.position.set(L.stack.x, floorY + 0.01, L.stack.z);
    const sh = L.stackScale * 3.4;
    stackShadow.scale.set(sh, sh * 0.62, 1);
    stackShadow.material.opacity = withAvatar ? 0.2 * (1 - p * 0.4) : 0;
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

    // Speech bubble follows the avatar's head on screen.
    if (bubbleEl && avatar) {
      tmp.copy(avatar.getHeadTop()).project(camera);
      const cw = container.clientWidth;
      const x = Math.min(cw - 130, Math.max(130, (tmp.x * 0.5 + 0.5) * cw));
      const y = (-tmp.y * 0.5 + 0.5) * container.clientHeight;
      bubbleEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  }

  return {
    stackOnScreen() {
      const v = new THREE.Vector3();
      stack.getWorldPosition(v).project(camera);
      const r = container.getBoundingClientRect();
      return { x: (v.x * 0.5 + 0.5) * r.width + r.left, y: (-v.y * 0.5 + 0.5) * r.height + r.top };
    },
    highlight(i: number) {
      if (i >= 0 && i !== selected) lift(i);
      selected = i;
    },
    wave: () => {
      avatar?.wave();
      onAvatarClick?.();
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
