// The skills keyboard: every keycap is a skill. Hover or tap to press one,
// type on your real keyboard to press the matching cap, or hit the space
// bar to send a wave across the board. Keys move on springs, a press sends
// a small ripple through the neighbouring keys, and a cobalt light follows
// the selected key so it glows on the caps around it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, prefersReducedMotion } from "./stage";
import type { SceneHandle } from "./stage";
import { makeContactShadow, makeKeyLegend } from "./textures";
import { spring, stepSpring, type Spring } from "../lib/math";
import { C } from "./palette";

const U = 0.92; // one key unit
const GAP = 0.08;
const TRAVEL = 0.14; // how far a pressed key sinks

const TONES: Record<string, { cap: string; text: string }> = {
  ink: { cap: C.ink, text: C.paperHi },
  cobalt: { cap: C.cobalt, text: C.paperHi },
  yellow: { cap: C.yellow, text: C.ink },
  paper: { cap: C.paperHi, text: C.ink },
  blank: { cap: "#DCDAEA", text: C.inkSoft },
};

export interface KeySkill {
  label: string;
  w: number;
  tone: string;
}

interface KeyDef extends KeySkill {
  index: number;
  space?: boolean;
}

interface Key {
  s: KeyDef;
  g: THREE.Group;
  cap: THREE.Mesh<RoundedBoxGeometry, THREE.MeshStandardMaterial>;
  /** Vertical travel, 0 = up, 1 = fully pressed. */
  y: Spring;
  /** Seconds until this key's part of a ripple or wave starts; < 0 idle. */
  delay: number;
  /** Strength of the pending ripple/wave lift (negative dips, positive lifts). */
  kick: number;
  glow: number;
  home: THREE.Vector3;
}

export interface KeyboardScene extends SceneHandle {
  pressIndex: (i: number) => void;
  wave: () => void;
}

export function createKeyboardScene(
  container: HTMLElement,
  { skills, onKey }: { skills: KeySkill[]; onKey?: (index: number) => void }
): KeyboardScene {
  const reduced = prefersReducedMotion();
  let rowUnits = 8;
  let camDist = 10;
  let ready = false;

  const stage = createStage(container, {
    fov: 28,
    onFrame: (dt, t) => frame(dt, t),
    onResize: ({ aspect }) => {
      const next = aspect < 0.8 ? 4.5 : 8;
      camDist = aspect < 0.8 ? 13.5 : aspect < 1.2 ? 12 : 10.2;
      if (next !== rowUnits) {
        rowUnits = next;
        if (ready) layoutKeys();
      }
    },
  });
  const { scene, camera, renderer, pointer } = stage;

  scene.add(new THREE.HemisphereLight(C.paperHi, C.mist, 0.8));
  const key = new THREE.DirectionalLight("#ffffff", 2.2);
  key.position.set(-3, 8, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.cobaltSoft, 1.0);
  rim.position.set(5, 2, -5);
  scene.add(rim);
  // Follows the selected key and lights the caps around it.
  const glowLight = new THREE.PointLight(C.cobalt, 0, 3.2, 1.6);
  glowLight.position.set(0, 0.6, 0);

  const board = new THREE.Group();
  board.add(glowLight);
  scene.add(board);
  const caseMat = new THREE.MeshPhysicalMaterial({ color: C.ink, roughness: 0.38, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.4 });
  let plate: THREE.Mesh | null = null;

  const shadow = makeContactShadow(0.42);
  shadow.position.y = -0.41;
  board.add(shadow);

  /* Keys ------------------------------------------------------------- */
  const geoCache = new Map<string, RoundedBoxGeometry>();
  const capGeo = (w: number): RoundedBoxGeometry => {
    const k = w.toFixed(2);
    if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w * U - GAP, 0.34, U - GAP, 4, 0.1));
    return geoCache.get(k)!;
  };

  const allKeys: KeyDef[] = [
    ...skills.map((s, i) => ({ ...s, index: i })),
    { label: "Space makes a wave", w: 4, tone: "blank", index: -1, space: true },
  ];

  const keys: Key[] = allKeys.map((s) => {
    const tone = TONES[s.tone] || TONES.paper;
    const g = new THREE.Group();
    const cap = new THREE.Mesh(
      capGeo(s.w),
      // Standard (not physical) material: two dozen caps, so keep the
      // shader cheap; the studio environment still gives them a sheen.
      new THREE.MeshStandardMaterial({
        color: tone.cap,
        roughness: 0.36,
        emissive: new THREE.Color(C.cobalt),
        emissiveIntensity: 0,
      })
    );
    cap.userData.key = s;
    g.add(cap);
    if (s.label) {
      const legend = new THREE.Mesh(
        new THREE.PlaneGeometry(s.w * U - GAP - 0.1, U - GAP - 0.1),
        new THREE.MeshBasicMaterial({
          map: makeKeyLegend(s.label, (s.w * U - GAP - 0.1) / (U - GAP - 0.1), tone.text, renderer),
          transparent: true,
          toneMapped: false,
          depthWrite: false,
        })
      );
      legend.rotation.x = -Math.PI / 2;
      legend.position.y = 0.172;
      g.add(legend);
    }
    board.add(g);
    return { s, g, cap, y: spring(0), delay: -1, kick: 0, glow: 0, home: new THREE.Vector3() };
  });
  const caps = keys.map((k) => k.cap);

  // Flow the keys into rows of `rowUnits`, centring each row, like a
  // compact keyboard.
  function layoutKeys() {
    const rows: { k: Key; w: number }[][] = [];
    let row: { k: Key; w: number }[] = [];
    let used = 0;
    keys.forEach((k) => {
      const w = k.s.space ? Math.min(k.s.w, rowUnits) : k.s.w;
      if (used + w > rowUnits + 0.01 && row.length) {
        rows.push(row);
        row = [];
        used = 0;
      }
      row.push({ k, w });
      used += w;
    });
    if (row.length) rows.push(row);

    const depth = rows.length * U;
    rows.forEach((r, ri) => {
      const total = r.reduce((a, b) => a + b.w, 0);
      let x = -(rowUnits * U) / 2 + ((rowUnits - total) * U) / 2;
      r.forEach(({ k, w }) => {
        k.home.set(x + (w * U) / 2, 0, -depth / 2 + ri * U + U / 2);
        x += w * U;
      });
    });

    if (plate) {
      board.remove(plate);
      plate.geometry.dispose();
    }
    plate = new THREE.Mesh(new RoundedBoxGeometry(rowUnits * U + 0.5, 0.36, depth + 0.5, 4, 0.16), caseMat);
    plate.position.y = -0.22;
    board.add(plate);
    shadow.scale.set(rowUnits * U * 1.45, depth * 1.7, 1);
  }
  layoutKeys();
  ready = true;

  /* Interaction ------------------------------------------------------ */
  let hovered: Key | null = null;
  let selected: Key | null = null;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";

  const pickKey = (x: number, y: number): Key | null => {
    const hit = stage.pick(x, y, caps)[0];
    return hit ? (keys.find((k) => k.cap === hit.object) ?? null) : null;
  };
  const notify = () => {
    const k = hovered || selected;
    onKey?.(k && k.s.index >= 0 ? k.s.index : -1);
  };

  /** Neighbours dip a little after a press, spreading outward. */
  const ripple = (from: Key) => {
    if (reduced) return;
    from.y.v += 9; // a sharp extra kick on the key itself
    keys.forEach((k) => {
      if (k === from) return;
      const d = Math.hypot(k.home.x - from.home.x, k.home.z - from.home.z);
      if (d > 2.6) return;
      k.delay = d * 0.045;
      k.kick = 3.2 * (1 - d / 2.6);
    });
  };
  /** Space bar: every key lifts in turn, sweeping out from the origin. */
  const triggerWave = (originX = 0) => {
    keys.forEach((k) => {
      k.delay = Math.abs(k.home.x - originX) * 0.07 + Math.abs(k.home.z) * 0.04;
      k.kick = reduced ? 0 : -7;
    });
  };
  const select = (k: Key | null) => {
    selected = k;
    if (k) ripple(k);
    notify();
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const k = pickKey(e.clientX, e.clientY);
    if (k !== hovered) {
      hovered = k;
      if (k && !reduced) k.y.v += 3;
      notify();
    }
    el.style.cursor = k ? "pointer" : "default";
  };
  let downAt: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    downAt = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: PointerEvent) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 8) return;
    const k = pickKey(e.clientX, e.clientY);
    if (!k) return;
    if (k.s.space) {
      k.y.v += 9;
      triggerWave(k.home.x);
      return;
    }
    select(k === selected ? null : k);
  };
  const onLeave = () => {
    hovered = null;
    notify();
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointerleave", onLeave);

  // Physical keyboard: only while the board is on screen, and never while
  // someone is typing into a form field.
  let onScreen = false;
  const io = new IntersectionObserver(([en]) => (onScreen = en.intersectionRatio > 0.2), {
    threshold: [0, 0.2, 0.4, 0.6],
  });
  io.observe(container);
  const cycle: Record<string, number> = {};
  const onKeyDown = (e: KeyboardEvent) => {
    if (!onScreen || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") return;
    if (e.code === "Space") {
      e.preventDefault();
      triggerWave(0);
      return;
    }
    const ch = e.key.length === 1 ? e.key.toLowerCase() : "";
    if (!/[a-z]/.test(ch)) return;
    const matches = keys.filter((k) => !k.s.space && k.s.label.toLowerCase().startsWith(ch));
    if (!matches.length) return;
    cycle[ch] = ((cycle[ch] ?? -1) + 1) % matches.length;
    select(matches[cycle[ch]]);
  };
  window.addEventListener("keydown", onKeyDown);

  /* Frame ------------------------------------------------------------ */
  const tiltX = spring(0);
  const tiltZ = spring(0);
  const glowPos = new THREE.Vector3();

  function frame(dt: number, t: number) {
    camera.position.set(pointer.sx * 0.6, camDist * 0.72, camDist * 0.7);
    camera.lookAt(0, -0.2, 0.25);
    board.rotation.x = stepSpring(tiltX, -pointer.sy * 0.08, 60, 12, dt);
    board.rotation.z = stepSpring(tiltZ, -pointer.sx * 0.05, 60, 12, dt);
    board.rotation.y = reduced ? 0 : Math.sin(t * 0.3) * 0.02;

    keys.forEach((k) => {
      // Pending ripple or wave: once its delay runs out, kick the spring.
      if (k.delay >= 0) {
        k.delay -= dt;
        if (k.delay < 0) {
          k.y.v += k.kick;
          k.kick = 0;
        }
      }
      const down = k === hovered || k === selected ? 1 : 0;
      const y = stepSpring(k.y, down, reduced ? 400 : 260, reduced ? 40 : 17, dt);
      k.g.position.set(k.home.x, -y * TRAVEL, k.home.z);
      k.glow = damp(k.glow, k === selected ? 1 : k === hovered ? 0.35 : 0, 12, dt);
      k.cap.material.emissiveIntensity = k.glow * 0.4;
    });

    // The glow light glides to the selected key.
    const focus = selected ?? hovered;
    if (focus) glowPos.set(focus.home.x, 0.55, focus.home.z);
    glowLight.position.lerp(glowPos, 1 - Math.exp(-14 * dt));
    glowLight.intensity = damp(glowLight.intensity, selected ? 3.2 : hovered ? 1.2 : 0, 10, dt);
  }

  return {
    pressIndex(i: number) {
      select(keys.find((k) => k.s.index === i) || null);
    },
    wave: () => triggerWave(0),
    dispose() {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      io.disconnect();
      geoCache.forEach((g) => g.dispose());
      stage.dispose();
    },
  };
}
