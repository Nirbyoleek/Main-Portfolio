// A stylised avatar of Nirbyoleek, modelled from three.js primitives so it
// needs no external model file. Fair skin, swept dark hair, rounded glasses,
// cobalt hoodie with headphones round the neck. It looks at the cursor with
// its eyes first and head second, blinks, breathes, types, glances down at
// the laptop when you stop moving, and waves when clicked.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { C } from "./palette";
import { damp } from "../lib/math";
import type { Pointer } from "./stage";

const SKIN = "#F1C9AB";
const SKIN_SHADE = "#E2A98A";
const BLUSH = "#EF9E95";
const HAIR = "#241A18";
const HAIR_HI = "#3A2A25";
const LIP = "#9A4740";

type Vec3 = [number, number, number];

const mat = (color: THREE.ColorRepresentation, opts: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts });

interface MeshOpts {
  pos?: Vec3;
  rot?: Vec3;
  scale?: Vec3 | number;
  shadow?: boolean;
}

function mesh<G extends THREE.BufferGeometry, M extends THREE.Material>(
  geo: G,
  material: M,
  { pos, rot, scale, shadow = true }: MeshOpts = {}
): THREE.Mesh<G, M> {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale !== undefined) {
    const v: Vec3 = Array.isArray(scale) ? scale : [scale, scale, scale];
    m.scale.set(...v);
  }
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A glasses rim: a rounded rectangle with a rounded-rectangle hole. */
function rimGeometry(w: number, h: number, r: number, t: number): THREE.ExtrudeGeometry {
  const outer = roundedRect(w, h, r);
  const inner = roundedRect(w - t * 2, h - t * 2, Math.max(0.005, r - t));
  outer.holes.push(new THREE.Path(inner.getPoints(24).reverse()));
  const g = new THREE.ExtrudeGeometry(outer, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 12,
  });
  g.center();
  return g;
}

export interface Avatar {
  root: THREE.Group;
  update: (dt: number, t: number, pointer: Pointer, opts?: { reduced?: boolean }) => void;
  wave: () => void;
  hitTargets: THREE.Object3D[];
  getHeadTop: () => THREE.Vector3;
  setHover: (on: boolean) => void;
}

interface Arm {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  hand: THREE.Group;
  side: number;
}

interface ArmPose {
  sx: number;
  sz: number;
  ex: number;
  ez: number;
}

export function createAvatar(): Avatar {
  const root = new THREE.Group();
  root.name = "avatar";

  const skin = mat(SKIN, { roughness: 0.5 });
  const skinShade = mat(SKIN_SHADE, { roughness: 0.55 });
  const blush = mat(BLUSH, { roughness: 0.6, transparent: true, opacity: 0.55 });
  const hair = mat(HAIR, { roughness: 0.78 });
  const hairHi = mat(HAIR_HI, { roughness: 0.7 });
  const hoodie = mat(C.cobalt, { roughness: 0.82 });
  const hoodieDeep = mat(C.cobaltDeep, { roughness: 0.88 });
  const tee = mat(C.paperHi, { roughness: 0.85 });
  const ink = mat(C.ink, { roughness: 0.35 });
  const yellow = mat(C.yellow, { roughness: 0.42 });
  const white = mat("#ffffff", { roughness: 0.25 });
  const metal = mat("#D3D1E3", { roughness: 0.28, metalness: 0.6 });
  const iris = mat("#3B2516", { roughness: 0.3 });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: "#DCE4FF",
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.18,
    clearcoat: 1,
    depthWrite: false,
  });

  /* Desk, chair and props ------------------------------------------- */
  const desk = new THREE.Group();
  desk.add(mesh(new RoundedBoxGeometry(1.9, 0.08, 1.0, 3, 0.03), ink, { pos: [0, -0.04, 0.32] }));
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12);
  [
    [-0.85, -0.08],
    [0.85, -0.08],
    [-0.85, 0.72],
    [0.85, 0.72],
  ].forEach(([x, z]) => desk.add(mesh(legGeo, metal, { pos: [x, -0.63, z] })));
  root.add(desk);

  // Chair back, visible behind the shoulders.
  const chair = new THREE.Group();
  chair.position.set(0, 0, -0.62);
  chair.add(mesh(new RoundedBoxGeometry(0.95, 0.95, 0.12, 4, 0.08), ink, { pos: [0, 0.32, 0], rot: [0.12, 0, 0] }));
  chair.add(mesh(new RoundedBoxGeometry(0.8, 0.8, 0.04, 4, 0.06), mat(C.yellow, { roughness: 0.7 }), { pos: [0, 0.33, 0.07], rot: [0.12, 0, 0] }));
  chair.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12), metal, { pos: [0, -0.4, -0.02] }));
  root.add(chair);

  // Laptop. The lid faces the avatar, so the viewer sees its back.
  const laptop = new THREE.Group();
  laptop.position.set(0, 0, 0.42);
  laptop.add(mesh(new RoundedBoxGeometry(0.8, 0.03, 0.54, 2, 0.012), metal, { pos: [0, 0.015, 0] }));
  laptop.add(
    mesh(new THREE.PlaneGeometry(0.68, 0.26), mat("#2A2752", { roughness: 0.9 }), {
      pos: [0, 0.031, -0.05],
      rot: [-Math.PI / 2, 0, 0],
      shadow: false,
    })
  );
  const lid = new THREE.Group();
  lid.position.set(0, 0.03, -0.27);
  lid.rotation.x = -0.3;
  lid.add(mesh(new RoundedBoxGeometry(0.8, 0.52, 0.02, 2, 0.012), metal, { pos: [0, 0.26, 0] }));
  // Stickers on the back of the lid
  lid.add(mesh(new THREE.CircleGeometry(0.06, 32), yellow, { pos: [-0.18, 0.33, 0.012], shadow: false }));
  lid.add(mesh(new THREE.CircleGeometry(0.045, 32), hoodie, { pos: [0.16, 0.18, 0.012], shadow: false }));
  lid.add(mesh(new RoundedBoxGeometry(0.16, 0.07, 0.004, 2, 0.02), ink, { pos: [0.1, 0.38, 0.012], rot: [0, 0, 0.2], shadow: false }));
  const screenGlow = mesh(
    new THREE.PlaneGeometry(0.74, 0.46),
    new THREE.MeshBasicMaterial({ color: C.cobaltSoft }),
    { pos: [0, 0.26, -0.011], rot: [0, Math.PI, 0], shadow: false }
  );
  lid.add(screenGlow);
  laptop.add(lid);
  root.add(laptop);

  // Coffee and a plant.
  const mug = new THREE.Group();
  mug.position.set(0.68, 0, 0.6);
  mug.add(mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.16, 28), yellow, { pos: [0, 0.08, 0] }));
  mug.add(mesh(new THREE.TorusGeometry(0.045, 0.014, 10, 24), yellow, { pos: [0.075, 0.085, 0] }));
  mug.add(mesh(new THREE.CircleGeometry(0.06, 24), mat("#3B2418"), { pos: [0, 0.155, 0], rot: [-Math.PI / 2, 0, 0], shadow: false }));
  root.add(mug);
  const plant = new THREE.Group();
  plant.position.set(-0.7, 0, 0.62);
  plant.add(mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 24), mat(C.paperHi), { pos: [0, 0.07, 0] }));
  const leaf = mat("#3E9C6B", { roughness: 0.6 });
  [
    [0, 0.2, 0, 0.07],
    [0.05, 0.25, 0.02, 0.055],
    [-0.05, 0.24, -0.02, 0.06],
    [0.01, 0.31, 0.0, 0.05],
  ].forEach(([x, y, z, r]) => plant.add(mesh(new THREE.SphereGeometry(r, 16, 12), leaf, { pos: [x, y, z] })));
  root.add(plant);

  /* Body ------------------------------------------------------------- */
  const body = new THREE.Group();
  body.position.set(0, 0, -0.2);
  root.add(body);

  const torso = mesh(new THREE.CapsuleGeometry(0.34, 0.4, 10, 28), hoodie, {
    pos: [0, 0.12, 0],
    scale: [1.1, 1, 0.74],
  });
  body.add(torso);
  // Tee showing at the neckline
  body.add(mesh(new THREE.TorusGeometry(0.115, 0.03, 10, 32), tee, { pos: [0, 0.6, 0.02], rot: [Math.PI / 2 + 0.25, 0, 0] }));
  // Hoodie lapels
  [-1, 1].forEach((s) =>
    body.add(
      mesh(new RoundedBoxGeometry(0.1, 0.42, 0.06, 2, 0.03), hoodieDeep, {
        pos: [0.1 * s, 0.32, 0.21],
        rot: [-0.25, 0, 0.32 * s],
      })
    )
  );
  // Hood bunched behind the neck
  body.add(mesh(new THREE.SphereGeometry(0.24, 24, 16), hoodieDeep, { pos: [0, 0.56, -0.17], scale: [1.25, 0.7, 0.7] }));
  // Drawstrings with metal tips
  [-0.075, 0.075].forEach((x) => {
    body.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 8), white, { pos: [x, 0.36, 0.25], rot: [0.2, 0, 0] }));
    body.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8), metal, { pos: [x, 0.24, 0.27], rot: [0.2, 0, 0] }));
  });
  // Headphones resting around the neck
  const phones = new THREE.Group();
  phones.position.set(0, 0.6, 0.02);
  phones.add(mesh(new THREE.TorusGeometry(0.2, 0.026, 12, 48, Math.PI * 1.15), ink, { rot: [Math.PI / 2 + 0.15, 0, Math.PI * 0.92] }));
  [-1, 1].forEach((s) => {
    phones.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 28), ink, { pos: [0.17 * s, -0.04, 0.12], rot: [0.3, 0, Math.PI / 2 - 0.5 * s] }));
    phones.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.065, 24), yellow, { pos: [0.19 * s, -0.035, 0.13], rot: [0.3, 0, Math.PI / 2 - 0.5 * s] }));
  });
  body.add(phones);
  body.add(mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.16, 20), skin, { pos: [0, 0.64, 0] }));

  /* Head ------------------------------------------------------------- */
  const head = new THREE.Group();
  head.position.set(0, 0.7, 0.01);
  body.add(head);
  const R = 0.33;
  const face = new THREE.Group(); // so the whole face can be nudged as one
  head.add(face);

  const skull = mesh(new THREE.SphereGeometry(R, 48, 36), skin, { pos: [0, 0.3, 0], scale: [0.93, 1.03, 0.96] });
  face.add(skull);
  // Chin, tucked mostly inside the skull so no seam crosses the cheeks
  face.add(mesh(new THREE.SphereGeometry(0.16, 32, 20), skin, { pos: [0, 0.08, 0.1], scale: [1.1, 0.7, 1] }));
  // Ears
  [-1, 1].forEach((s) => {
    face.add(mesh(new THREE.SphereGeometry(0.062, 18, 14), skin, { pos: [0.305 * s, 0.28, -0.01], scale: [0.55, 1, 0.85] }));
    face.add(mesh(new THREE.SphereGeometry(0.032, 12, 10), skinShade, { pos: [0.322 * s, 0.28, 0.0], scale: [0.4, 0.9, 0.7] }));
  });
  // Blush
  [-1, 1].forEach((s) =>
    face.add(mesh(new THREE.CircleGeometry(0.045, 24), blush, { pos: [0.165 * s, 0.17, 0.268], rot: [0, 0.48 * s, 0], shadow: false }))
  );

  // Eyes: white, iris, pupil and a catch-light. Irises follow the cursor.
  const eyes: { g: THREE.Group; ir: THREE.Group; side: number }[] = [];
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(0.105 * s, 0.285, 0.272);
    g.add(mesh(new THREE.SphereGeometry(0.045, 24, 18), white, { scale: [1, 1.1, 0.5], shadow: false }));
    const ir = new THREE.Group();
    ir.add(mesh(new THREE.SphereGeometry(0.028, 20, 16), iris, { scale: [1, 1.08, 0.5], shadow: false }));
    ir.add(mesh(new THREE.SphereGeometry(0.014, 12, 10), ink, { pos: [0, 0, 0.006], scale: [1, 1, 0.5], shadow: false }));
    ir.add(mesh(new THREE.SphereGeometry(0.0075, 8, 8), white, { pos: [0.011, 0.012, 0.012], shadow: false }));
    ir.position.z = 0.014;
    g.add(ir);
    // Upper lid line
    g.add(mesh(new THREE.TorusGeometry(0.046, 0.006, 6, 20, Math.PI), ink, { pos: [0, 0.004, 0.012], scale: [1, 1.05, 1], shadow: false }));
    face.add(g);
    eyes.push({ g, ir, side: s });
  });
  // Brows: short curved arcs
  const brows = [-1, 1].map((s) => {
    const b = mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20, Math.PI * 0.62), hair, {
      pos: [0.105 * s, 0.33, 0.285],
      rot: [0.1, 0, Math.PI / 2 - Math.PI * 0.31 + 0.12 * s],
      shadow: false,
    });
    face.add(b);
    return b;
  });
  // Nose
  face.add(mesh(new THREE.SphereGeometry(0.03, 18, 14), skinShade, { pos: [0, 0.205, 0.315], scale: [1, 1.15, 1] }));
  face.add(mesh(new THREE.SphereGeometry(0.026, 18, 14), skin, { pos: [0, 0.215, 0.318], scale: [1, 1.2, 1] }));
  // Mouth: a smile line that opens into a grin when happy.
  const mouth = new THREE.Group();
  mouth.position.set(0, 0.128, 0.272);
  mouth.rotation.x = -0.2;
  const smile = mesh(new THREE.TorusGeometry(0.05, 0.0085, 8, 24, Math.PI), mat(LIP), { rot: [0, 0, Math.PI], shadow: false });
  const grin = mesh(new THREE.SphereGeometry(0.052, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat("#5A1F24"), {
    pos: [0, 0.006, -0.006],
    scale: [1, 0.01, 0.5],
    shadow: false,
  });
  // Upper teeth: a thin rounded strip just inside the top of the open mouth.
  const teeth = mesh(new RoundedBoxGeometry(0.064, 0.016, 0.006, 2, 0.003), white, {
    pos: [0, -0.004, 0.03],
    scale: [1, 0.01, 1],
    shadow: false,
  });
  mouth.add(grin, teeth, smile);
  face.add(mouth);

  // Glasses: two rounded rims, a bridge, arms back to the ears, and lenses.
  const glasses = new THREE.Group();
  glasses.position.set(0, 0.285, 0.322);
  const rim = rimGeometry(0.155, 0.118, 0.04, 0.016);
  [-1, 1].forEach((s) => {
    glasses.add(mesh(rim, ink, { pos: [0.1 * s, 0, 0], rot: [0, 0.14 * s, 0] }));
    glasses.add(
      mesh(new THREE.PlaneGeometry(0.13, 0.093), lensMat, { pos: [0.1 * s, 0, 0.002], rot: [0, 0.14 * s, 0], shadow: false })
    );
    // arm
    glasses.add(
      mesh(new THREE.BoxGeometry(0.012, 0.014, 0.3), ink, { pos: [0.182 * s, 0.018, -0.15], rot: [0, -0.12 * s, 0] })
    );
  });
  glasses.add(mesh(new THREE.TorusGeometry(0.026, 0.008, 8, 16, Math.PI), ink, { pos: [0, 0.008, 0.004] }));
  face.add(glasses);

  // Hair: a fitted cap at the back and sides, a fade above the ears, and a
  // swept quiff on top.
  const capTop = mesh(new THREE.SphereGeometry(R + 0.02, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.4), hair, {
    pos: [0, 0.3, -0.012],
    rot: [-0.3, 0, 0],
    scale: [0.97, 1.05, 1.0],
  });
  face.add(capTop);
  // Short sides and back: a band from the crown down to just above the
  // ears, open at the front so the forehead and face stay clear.
  const capSides = mesh(
    new THREE.SphereGeometry(R + 0.012, 48, 24, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56, Math.PI * 0.12, Math.PI * 0.36),
    hair,
    { pos: [0, 0.3, -0.005], scale: [0.95, 1.04, 0.98] }
  );
  face.add(capSides);
  const capBack = mesh(new THREE.SphereGeometry(R + 0.01, 40, 24, Math.PI, Math.PI, Math.PI * 0.4, Math.PI * 0.24), hair, {
    pos: [0, 0.3, -0.008],
    scale: [0.95, 1.04, 0.98],
  });
  face.add(capBack);
  // Quiff: overlapping lobes swept towards the avatar's left.
  const quiff = new THREE.Group();
  quiff.position.set(0, 0.56, 0.06);
  const lobes: [number, number, number, number, Vec3, number][] = [
    [-0.12, 0.02, 0.12, 0.13, [1.35, 0.62, 0.9], -0.35],
    [0.0, 0.06, 0.1, 0.15, [1.45, 0.7, 1.0], -0.15],
    [0.12, 0.05, 0.05, 0.13, [1.3, 0.66, 1.05], 0.1],
    [0.05, 0.08, -0.06, 0.15, [1.4, 0.62, 1.1], 0],
    [-0.08, 0.06, -0.08, 0.14, [1.3, 0.62, 1.1], -0.1],
  ];
  lobes.forEach(([x, y, z, r, sc, rz]) => quiff.add(mesh(new THREE.SphereGeometry(r, 24, 18), hair, { pos: [x, y, z], scale: sc, rot: [0.15, 0, rz] })));
  // a lighter strand catching the light
  quiff.add(mesh(new THREE.SphereGeometry(0.08, 18, 14), hairHi, { pos: [-0.02, 0.12, 0.12], scale: [1.6, 0.4, 0.8], rot: [0.2, 0, -0.3] }));
  face.add(quiff);

  /* Arms ------------------------------------------------------------- */
  const makeArm = (side: number): Arm => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.37 * side, 0.46, 0.02);
    shoulder.add(mesh(new THREE.SphereGeometry(0.1, 18, 14), hoodie));
    shoulder.add(mesh(new THREE.CapsuleGeometry(0.088, 0.24, 6, 16), hoodie, { pos: [0, -0.16, 0] }));
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.32, 0);
    shoulder.add(elbow);
    elbow.add(mesh(new THREE.CapsuleGeometry(0.08, 0.2, 6, 16), hoodie, { pos: [0, -0.14, 0] }));
    elbow.add(mesh(new THREE.CylinderGeometry(0.083, 0.083, 0.05, 18), hoodieDeep, { pos: [0, -0.28, 0] }));
    const hand = new THREE.Group();
    hand.position.set(0, -0.36, 0);
    hand.add(mesh(new THREE.SphereGeometry(0.068, 20, 16), skin, { scale: [1, 1.12, 0.78] }));
    hand.add(mesh(new THREE.CapsuleGeometry(0.022, 0.05, 4, 8), skin, { pos: [0.055 * -side, 0.02, 0.03], rot: [0, 0, 0.6 * side] }));
    elbow.add(hand);
    body.add(shoulder);
    return { shoulder, elbow, hand, side };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  const restArm = (arm: Arm, t: number, typing: boolean): ArmPose => {
    const tap = typing ? Math.sin(t * 11 + arm.side * 1.7) * 0.06 : 0;
    return { sx: -0.55, sz: 0.12 * arm.side, ex: -1.05 + tap, ez: -0.3 * arm.side };
  };

  /* Animation state -------------------------------------------------- */
  const state = {
    blinkIn: 2.5,
    blink: 0,
    waving: 0,
    look: new THREE.Vector2(),
    lastMove: 0,
    lastPointer: new THREE.Vector2(),
    hover: 0,
    happy: 0,
  };

  const hitTargets = [torso, skull, capTop, capSides, capBack, ...quiff.children, ...face.children];

  function update(dt: number, t: number, pointer: Pointer, { reduced = false }: { reduced?: boolean } = {}) {
    // When the cursor rests for a few seconds, glance down at the laptop.
    if (Math.abs(pointer.x - state.lastPointer.x) + Math.abs(pointer.y - state.lastPointer.y) > 0.002) {
      state.lastMove = t;
      state.lastPointer.set(pointer.x, pointer.y);
    }
    const idle = !reduced && t - state.lastMove > 4 && state.waving <= 0;
    const tx = idle ? 0.05 : pointer.sx;
    const ty = idle ? -0.75 : pointer.sy;
    state.look.x = damp(state.look.x, tx, idle ? 2 : 5, dt);
    state.look.y = damp(state.look.y, ty, idle ? 2 : 5, dt);

    head.rotation.y = state.look.x * 0.6;
    head.rotation.x = -state.look.y * 0.28 + (reduced ? 0 : Math.sin(t * 0.8) * 0.015);
    head.rotation.z = -state.look.x * 0.05;
    body.rotation.y = state.look.x * 0.12;

    // Irises lead the head.
    eyes.forEach((e) => {
      e.ir.position.x = THREE.MathUtils.clamp(state.look.x * 0.016, -0.014, 0.014);
      e.ir.position.y = THREE.MathUtils.clamp(state.look.y * 0.012, -0.012, 0.012);
    });

    if (!reduced) {
      torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
      head.position.y = 0.7 + Math.sin(t * 1.6) * 0.004;
    }

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
    eyes.forEach((e) => (e.g.scale.y = eyeY));

    // Arms
    const typing = !reduced && state.waving <= 0;
    const L = restArm(armL, t, typing);
    let Rp = restArm(armR, t, typing);
    if (state.waving > 0) {
      state.waving -= dt;
      const k = Math.min(1, state.waving * 3, (1.9 - state.waving) * 4);
      const wag = Math.sin(t * 14) * 0.45;
      Rp = {
        sx: THREE.MathUtils.lerp(Rp.sx, -0.2, k),
        sz: THREE.MathUtils.lerp(Rp.sz, 2.5, k),
        ex: THREE.MathUtils.lerp(Rp.ex, 0, k),
        ez: THREE.MathUtils.lerp(Rp.ez, 0.35 + wag, k),
      };
    }
    const applyArm = (arm: Arm, p: ArmPose) => {
      arm.shoulder.rotation.x = damp(arm.shoulder.rotation.x, p.sx, 14, dt);
      arm.shoulder.rotation.z = damp(arm.shoulder.rotation.z, p.sz, 14, dt);
      arm.elbow.rotation.x = damp(arm.elbow.rotation.x, p.ex, 14, dt);
      arm.elbow.rotation.z = damp(arm.elbow.rotation.z, p.ez, 18, dt);
    };
    applyArm(armL, L);
    applyArm(armR, Rp);

    // Expression: brows lift and the smile opens into a grin.
    const happyTarget = Math.max(state.waving > 0 ? 1 : 0, state.hover * 0.7);
    state.happy = damp(state.happy, happyTarget, 10, dt);
    brows.forEach((b) => (b.position.y = 0.33 + state.happy * 0.022));
    smile.scale.set(1 + state.happy * 0.25, 1 + state.happy * 0.3, 1);
    grin.scale.y = 0.01 + state.happy * 0.9;
    teeth.scale.y = 0.01 + state.happy * 0.99;
    grin.visible = teeth.visible = state.happy > 0.03;

    screenGlow.material.color.setHSL(0.65, 0.85, 0.82 + Math.sin(t * 2) * 0.03);
  }

  function wave() {
    state.waving = 1.9;
  }

  const headTop = new THREE.Vector3();
  function getHeadTop() {
    skull.getWorldPosition(headTop);
    headTop.y += 0.5 * root.scale.y;
    return headTop;
  }

  return {
    root,
    update,
    wave,
    hitTargets,
    getHeadTop,
    setHover(v: boolean) {
      state.hover = v ? 1 : 0;
    },
  };
}
