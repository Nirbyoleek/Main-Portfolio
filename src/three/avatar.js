// A stylised, hand-modelled avatar built from three.js primitives, so it
// needs no external model file. It looks at the cursor, blinks, breathes,
// types on its laptop and waves when clicked.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { C } from "./palette.js";
import { damp } from "./stage.js";

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts });

function mesh(geo, material, { pos, rot, scale, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

export function createAvatar() {
  const root = new THREE.Group();
  root.name = "avatar";

  const skin = mat(C.skin, { roughness: 0.55 });
  const skinShade = mat(C.skinShade, { roughness: 0.6 });
  const hair = mat(C.hair, { roughness: 0.85 });
  const hoodie = mat(C.cobalt, { roughness: 0.8 });
  const hoodieDeep = mat(C.cobaltDeep, { roughness: 0.85 });
  const ink = mat(C.ink, { roughness: 0.4 });
  const yellow = mat(C.yellow, { roughness: 0.45 });
  const white = mat("#ffffff", { roughness: 0.2 });
  const metal = mat("#CFCDE0", { roughness: 0.3, metalness: 0.55 });

  /* Desk + laptop ------------------------------------------------------ */
  const desk = new THREE.Group();
  desk.add(mesh(new RoundedBoxGeometry(1.7, 0.08, 0.95, 3, 0.03), ink, { pos: [0, -0.04, 0.3] }));
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12);
  [
    [-0.75, 0.0],
    [0.75, 0.0],
    [-0.75, 0.65],
    [0.75, 0.65],
  ].forEach(([x, z]) => desk.add(mesh(legGeo, metal, { pos: [x, -0.63, z] })));
  root.add(desk);

  const laptop = new THREE.Group();
  laptop.position.set(0, 0, 0.42);
  laptop.add(mesh(new RoundedBoxGeometry(0.78, 0.03, 0.52, 2, 0.012), metal, { pos: [0, 0.015, 0] }));
  laptop.add(
    mesh(new THREE.PlaneGeometry(0.66, 0.24), mat("#2A2752", { roughness: 0.9 }), {
      pos: [0, 0.031, -0.06],
      rot: [-Math.PI / 2, 0, 0],
      shadow: false,
    })
  );
  // The lid faces the avatar (away from the viewer), so we see its back
  // with a small logo dot.
  const lid = new THREE.Group();
  lid.position.set(0, 0.03, -0.26);
  lid.rotation.x = -0.32;
  lid.add(mesh(new RoundedBoxGeometry(0.78, 0.5, 0.02, 2, 0.01), metal, { pos: [0, 0.25, 0] }));
  lid.add(mesh(new THREE.CircleGeometry(0.035, 24), yellow, { pos: [0, 0.27, 0.011], shadow: false }));
  const screenGlow = mesh(
    new THREE.PlaneGeometry(0.72, 0.44),
    new THREE.MeshBasicMaterial({ color: C.cobaltSoft }),
    { pos: [0, 0.25, -0.011], rot: [0, Math.PI, 0], shadow: false }
  );
  lid.add(screenGlow);
  laptop.add(lid);
  // A mug, because every desk has one.
  const mug = new THREE.Group();
  mug.position.set(0.6, 0, 0.55);
  mug.add(mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.16, 24), yellow, { pos: [0, 0.08, 0] }));
  mug.add(mesh(new THREE.TorusGeometry(0.045, 0.014, 10, 24), yellow, { pos: [0.075, 0.085, 0], rot: [0, 0, 0] }));
  mug.add(mesh(new THREE.CircleGeometry(0.06, 24), mat("#3B2418"), { pos: [0, 0.155, 0], rot: [-Math.PI / 2, 0, 0], shadow: false }));
  root.add(mug);
  root.add(laptop);

  /* Body ------------------------------------------------------------- */
  // The avatar sits behind the desk (negative z), facing +z.
  const body = new THREE.Group();
  body.position.set(0, 0, -0.18);
  root.add(body);

  const torso = mesh(new THREE.CapsuleGeometry(0.36, 0.42, 8, 24), hoodie, {
    pos: [0, 0.12, 0],
    scale: [1.08, 1, 0.72],
  });
  body.add(torso);
  // hood bunched behind the neck
  body.add(mesh(new THREE.TorusGeometry(0.2, 0.085, 14, 32), hoodieDeep, { pos: [0, 0.6, -0.08], rot: [Math.PI / 2.4, 0, 0] }));
  // drawstrings
  [-0.07, 0.07].forEach((x) =>
    body.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), white, { pos: [x, 0.47, 0.23], rot: [0.15, 0, 0] }))
  );
  body.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.16, 20), skin, { pos: [0, 0.66, 0] }));

  /* Head ------------------------------------------------------------- */
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  body.add(head);

  const skull = mesh(new THREE.SphereGeometry(0.3, 40, 32), skin, { pos: [0, 0.26, 0], scale: [0.95, 1.06, 0.98] });
  head.add(skull);
  // jaw softens the sphere into a face
  head.add(mesh(new THREE.SphereGeometry(0.22, 32, 24), skin, { pos: [0, 0.14, 0.07], scale: [1.05, 0.8, 0.95] }));
  [-1, 1].forEach((s) => head.add(mesh(new THREE.SphereGeometry(0.06, 16, 12), skinShade, { pos: [0.285 * s, 0.25, 0.0] })));

  // Hair: a cap plus a few tufts for a soft quiff.
  const cap = mesh(new THREE.SphereGeometry(0.315, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, {
    pos: [0, 0.28, -0.015],
    rot: [-0.32, 0, 0],
    scale: [1.0, 1.0, 1.04],
  });
  head.add(cap);
  [
    [0.0, 0.55, 0.13, 0.13],
    [-0.12, 0.53, 0.12, 0.11],
    [0.12, 0.52, 0.12, 0.1],
    [0.06, 0.57, 0.04, 0.12],
    [-0.18, 0.44, 0.15, 0.08],
  ].forEach(([x, y, z, r]) => head.add(mesh(new THREE.SphereGeometry(r, 20, 16), hair, { pos: [x, y, z] })));
  // sideburns
  [-1, 1].forEach((s) =>
    head.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), hair, { pos: [0.26 * s, 0.3, 0.07], scale: [0.6, 1.4, 0.8] }))
  );

  // Eyes (blink by scaling Y) with small highlights.
  const eyes = [];
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(0.105 * s, 0.27, 0.265);
    g.add(mesh(new THREE.SphereGeometry(0.038, 20, 16), ink, { scale: [1, 1.25, 0.6], shadow: false }));
    g.add(mesh(new THREE.SphereGeometry(0.011, 8, 8), white, { pos: [0.012, 0.016, 0.022], shadow: false }));
    head.add(g);
    eyes.push(g);
  });
  // Brows
  const brows = [-1, 1].map((s) => {
    const b = mesh(new RoundedBoxGeometry(0.1, 0.022, 0.03, 2, 0.01), hair, {
      pos: [0.11 * s, 0.355, 0.262],
      rot: [0, 0, -0.08 * s],
    });
    head.add(b);
    return b;
  });
  head.add(mesh(new THREE.SphereGeometry(0.034, 16, 12), skinShade, { pos: [0, 0.21, 0.3], scale: [1, 0.85, 1] }));
  // Smile
  const mouth = mesh(new THREE.TorusGeometry(0.06, 0.013, 8, 24, Math.PI), mat("#4A1E1E"), {
    pos: [0, 0.135, 0.275],
    rot: [0.15, 0, Math.PI],
    shadow: false,
  });
  head.add(mouth);

  // Headphones
  const band = mesh(new THREE.TorusGeometry(0.335, 0.026, 12, 48, Math.PI), yellow, { pos: [0, 0.27, -0.02] });
  head.add(band);
  [-1, 1].forEach((s) => {
    head.add(mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.07, 28), ink, { pos: [0.33 * s, 0.24, -0.02], rot: [0, 0, Math.PI / 2] }));
    head.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.075, 24), yellow, { pos: [0.345 * s, 0.24, -0.02], rot: [0, 0, Math.PI / 2] }));
  });

  /* Arms ------------------------------------------------------------- */
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.38 * side, 0.45, 0.02);
    const upper = mesh(new THREE.CapsuleGeometry(0.085, 0.24, 6, 16), hoodie, { pos: [0, -0.16, 0] });
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.32, 0);
    shoulder.add(elbow);
    elbow.add(mesh(new THREE.CapsuleGeometry(0.075, 0.22, 6, 16), hoodie, { pos: [0, -0.15, 0] }));
    // cuff + hand
    elbow.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), hoodieDeep, { pos: [0, -0.3, 0] }));
    const hand = mesh(new THREE.SphereGeometry(0.075, 20, 16), skin, { pos: [0, -0.37, 0], scale: [1, 1.05, 0.8] });
    elbow.add(hand);
    body.add(shoulder);
    return { shoulder, elbow, side };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Rest pose: hands forward on the laptop keyboard.
  const restArm = (arm, t, typing) => {
    const tap = typing ? Math.sin(t * 11 + arm.side * 1.7) * 0.06 : 0;
    return {
      sx: -0.55,
      sz: 0.12 * arm.side,
      ex: -1.05 + tap,
      ez: -0.3 * arm.side,
    };
  };

  /* Animation state -------------------------------------------------- */
  const state = {
    blinkIn: 2.5,
    blink: 0,
    waving: 0, // seconds left in the current wave
    look: new THREE.Vector2(),
    hover: 0,
  };

  // Everything the click raycast should hit.
  const hitTargets = [torso, skull, cap, ...head.children];

  /** Pointer is -1..1; `active` is false when the pointer has left the page. */
  function update(dt, t, pointer, { reduced = false } = {}) {
    const lookX = pointer.sx;
    const lookY = pointer.sy;
    state.look.x = damp(state.look.x, lookX, 5, dt);
    state.look.y = damp(state.look.y, lookY, 5, dt);

    // Head follows the cursor; the body follows a little.
    head.rotation.y = state.look.x * 0.75;
    head.rotation.x = -state.look.y * 0.35 + (reduced ? 0 : Math.sin(t * 0.8) * 0.02);
    head.rotation.z = -state.look.x * 0.06;
    body.rotation.y = state.look.x * 0.14;

    // Eyes drift ahead of the head.
    eyes.forEach((e, i) => {
      e.position.x = (i === 0 ? -0.105 : 0.105) + state.look.x * 0.012;
      e.position.y = 0.27 + state.look.y * 0.01;
    });

    // Breathing
    if (!reduced) torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;

    // Blink
    state.blinkIn -= dt;
    if (state.blinkIn <= 0) {
      state.blink = 0.16;
      state.blinkIn = 2 + Math.random() * 3.5;
    }
    let eyeY = 1;
    if (state.blink > 0) {
      state.blink -= dt;
      eyeY = Math.max(0.08, Math.abs(state.blink / 0.08 - 1));
    }
    eyes.forEach((e) => (e.scale.y = eyeY));

    // Arms
    const typing = !reduced && state.waving <= 0;
    const L = restArm(armL, t, typing);
    let R = restArm(armR, t, typing);
    if (state.waving > 0) {
      state.waving -= dt;
      const k = Math.min(1, state.waving * 3, (1.9 - state.waving) * 4);
      const wag = Math.sin(t * 14) * 0.45;
      R = {
        sx: THREE.MathUtils.lerp(R.sx, -0.2, k),
        sz: THREE.MathUtils.lerp(R.sz, 2.5, k),
        ex: THREE.MathUtils.lerp(R.ex, 0, k),
        ez: THREE.MathUtils.lerp(R.ez, 0.35 + wag, k),
      };
    }
    const applyArm = (arm, p) => {
      arm.shoulder.rotation.x = damp(arm.shoulder.rotation.x, p.sx, 14, dt);
      arm.shoulder.rotation.z = damp(arm.shoulder.rotation.z, p.sz, 14, dt);
      arm.elbow.rotation.x = damp(arm.elbow.rotation.x, p.ex, 14, dt);
      arm.elbow.rotation.z = damp(arm.elbow.rotation.z, p.ez, 18, dt);
    };
    applyArm(armL, L);
    applyArm(armR, R);

    // Brows lift and the smile widens while waving or hovered.
    const happy = Math.max(state.waving > 0 ? 1 : 0, state.hover);
    brows.forEach((b) => (b.position.y = damp(b.position.y, 0.355 + happy * 0.025, 10, dt)));
    mouth.scale.x = damp(mouth.scale.x, 1 + happy * 0.35, 10, dt);
    mouth.scale.y = damp(mouth.scale.y, 1 + happy * 0.6, 10, dt);

    // The laptop screen pulses faintly, as if something is compiling.
    screenGlow.material.color.setHSL(0.65, 0.85, 0.82 + Math.sin(t * 2) * 0.03);
  }

  function wave() {
    state.waving = 1.9;
  }

  /** World position of the top of the head, for placing the speech bubble. */
  const headTop = new THREE.Vector3();
  function getHeadTop() {
    skull.getWorldPosition(headTop);
    headTop.y += 0.42;
    return headTop;
  }

  return {
    root,
    update,
    wave,
    hitTargets,
    getHeadTop,
    setHover(v) {
      state.hover = v ? 1 : 0;
    },
  };
}
