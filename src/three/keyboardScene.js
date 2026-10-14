// The skills keyboard: every keycap is a skill. Hover or tap to press one,
// type on your real keyboard to press the matching cap, or hit the space
// bar to send a wave across the board.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, prefersReducedMotion, isCoarsePointer } from "./stage.js";
import { makeKeyLegend } from "./mocks.js";
import { C } from "./palette.js";

const U = 0.92; // one key unit
const GAP = 0.08;

const TONES = {
  ink: { cap: C.ink, text: C.paperHi },
  cobalt: { cap: C.cobalt, text: C.paperHi },
  yellow: { cap: C.yellow, text: C.ink },
  paper: { cap: C.paperHi, text: C.ink },
  blank: { cap: "#DCDAEA", text: C.inkSoft },
};

export function createKeyboardScene(container, { skills, onKey }) {
  const reduced = prefersReducedMotion();
  const coarse = isCoarsePointer();
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

  scene.add(new THREE.HemisphereLight(C.paperHi, C.mist, 0.75));
  const key = new THREE.DirectionalLight("#ffffff", 2.3);
  key.position.set(-3, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.cobaltSoft, 1.0);
  rim.position.set(5, 2, -5);
  scene.add(rim);

  const board = new THREE.Group();
  scene.add(board);
  const caseMat = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.45, metalness: 0.1 });
  let plate = null;

  const shadowFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: C.ink, opacity: 0.16 })
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.42;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  /* Keys ------------------------------------------------------------- */
  const geoCache = new Map();
  const capGeo = (w) => {
    const k = w.toFixed(2);
    if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w * U - GAP, 0.34, U - GAP, 4, 0.1));
    return geoCache.get(k);
  };

  const allKeys = [
    ...skills.map((s, i) => ({ ...s, index: i })),
    { label: "Space makes a wave", w: 4, tone: "blank", index: -1, space: true },
  ];

  const keys = allKeys.map((s) => {
    const tone = TONES[s.tone] || TONES.paper;
    const g = new THREE.Group();
    const cap = new THREE.Mesh(
      capGeo(s.w),
      new THREE.MeshStandardMaterial({ color: tone.cap, roughness: 0.42 })
    );
    cap.castShadow = true;
    cap.receiveShadow = true;
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
    return { s, g, cap, press: 0, wave: 0, home: new THREE.Vector3() };
  });
  const caps = keys.map((k) => k.cap);

  // Flow the keys into rows of `rowUnits`, stretching the last key of each
  // row so every row ends flush, like a real keyboard.
  function layoutKeys() {
    const rows = [];
    let row = [];
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
      const extra = rowUnits - total;
      // Spread leftover width across the row's keys by offsetting.
      let x = -(rowUnits * U) / 2 + (extra * U) / 2;
      r.forEach(({ k, w }) => {
        k.home.set(x + (w * U) / 2, 0, -depth / 2 + ri * U + U / 2);
        x += w * U;
      });
    });

    if (plate) {
      board.remove(plate);
      plate.geometry.dispose();
    }
    plate = new THREE.Mesh(
      new RoundedBoxGeometry(rowUnits * U + 0.5, 0.36, depth + 0.5, 4, 0.16),
      caseMat
    );
    plate.position.y = -0.22;
    plate.castShadow = true;
    plate.receiveShadow = true;
    board.add(plate);
  }
  layoutKeys();
  ready = true;

  /* Interaction ------------------------------------------------------ */
  let hovered = null;
  let selected = null;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";

  const pickKey = (x, y) => {
    const hit = stage.pick(x, y, caps)[0];
    return hit ? keys.find((k) => k.cap === hit.object) : null;
  };
  const notify = () => {
    const k = hovered || selected;
    onKey?.(k && k.s.index >= 0 ? k.s.index : -1);
  };
  const triggerWave = (originX = 0) => {
    keys.forEach((k) => {
      k.wave = -Math.abs(k.home.x - originX) * 0.08 - Math.abs(k.home.z) * 0.05;
    });
  };

  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const k = pickKey(e.clientX, e.clientY);
    if (k !== hovered) {
      hovered = k;
      notify();
    }
    el.style.cursor = k ? "pointer" : "default";
  };
  let downAt = null;
  const onDown = (e) => {
    downAt = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 8) return;
    const k = pickKey(e.clientX, e.clientY);
    if (!k) return;
    if (k.s.space) {
      triggerWave(k.home.x);
      return;
    }
    selected = k === selected ? null : k;
    notify();
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
  const cycle = {};
  const onKeyDown = (e) => {
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
    selected = matches[cycle[ch]];
    selected.press = 1.4; // a deeper, springy press
    notify();
  };
  window.addEventListener("keydown", onKeyDown);

  /* Frame ------------------------------------------------------------ */
  function frame(dt, t) {
    camera.position.set(pointer.sx * 0.6, camDist * 0.72, camDist * 0.7);
    camera.lookAt(0, -0.2, 0.25);
    board.rotation.x = -pointer.sy * 0.08;
    board.rotation.z = -pointer.sx * 0.05;
    board.rotation.y = reduced ? 0 : Math.sin(t * 0.3) * 0.02;

    keys.forEach((k) => {
      const down = k === hovered || k === selected ? 1 : 0;
      k.press = damp(k.press, down, k.press > 1 ? 6 : 16, dt);
      let lift = 0;
      if (k.wave < 1.2) {
        k.wave += dt * 2.4;
        if (k.wave > 0 && k.wave < 1) lift = Math.sin(k.wave * Math.PI) * 0.35;
      }
      k.g.position.set(k.home.x, -Math.min(k.press, 1.2) * 0.14 + lift, k.home.z);
      const target = k === selected ? 1 : 0;
      k.cap.material.emissive.set(C.cobalt);
      k.cap.material.emissiveIntensity = damp(k.cap.material.emissiveIntensity, target * 0.35, 10, dt);
    });
  }

  return {
    pressIndex(i) {
      selected = keys.find((k) => k.s.index === i) || null;
      notify();
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
