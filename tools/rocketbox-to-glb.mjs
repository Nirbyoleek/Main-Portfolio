// Builds public/avatar/avatar.glb from a Microsoft Rocketbox avatar (MIT,
// https://github.com/microsoft/Microsoft-Rocketbox) so TalkingHead can animate it:
//
//  - re-rigs the 3ds Max biped skeleton to Mixamo bone names, with each bone's
//    rest orientation taken from the Ready Player Me rig TalkingHead's poses
//    were made for (tools/rpm-rest-pose.json), aligned to this body's limbs;
//  - keeps the 52 ARKit and 15 Oculus viseme blend shapes, renamed, stored as
//    sparse morph targets; drops the rest;
//  - converts the TGA textures to web-sized JPEGs;
//  - optionally adds glasses, rigid on the head (GLASSES env, JSON).
//
// Not part of the site build. Needs three and sharp:
//   npm i --no-save sharp
//   GLASSES='{"dx":0.003,"dy":0.0005,"w":0.05,"h":0.033,"r":0.0022,"n":5,"lower":0.9,"z":0.029,"wrap":0.007,"tilt":0.25,"armOut":0.015,"armBack":0.11,"color":[0.015,0.015,0.018,1]}' \
//   node tools/rocketbox-to-glb.mjs Male_Adult_20_facial.fbx Textures m027 public/avatar/avatar.glb
import fs from 'fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');

const [, , inFbx, texDir, prefix, outGlb] = process.argv;
const TEX = Number(process.env.TEX || 1024);
THREE.TextureLoader.prototype.load = function () { return new THREE.Texture(); };

/* ---------- load ---------- */
const buf = fs.readFileSync(inFbx);
const obj = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
obj.updateMatrixWorld(true);
const mesh = obj.children.find((c) => c.isSkinnedMesh);
const SCALE = 0.01; // cm -> m
const rbBones = mesh.skeleton.bones;
const rbWorld = mesh.skeleton.boneInverses.map((m) => m.clone().invert());
const rbPos = (name) => {
  const i = rbBones.findIndex((b) => b.name === name);
  if (i < 0) throw new Error('missing ' + name);
  return new THREE.Vector3().setFromMatrixPosition(rbWorld[i]).multiplyScalar(SCALE);
};
const ref = JSON.parse(fs.readFileSync(new URL('./rpm-rest-pose.json', import.meta.url)));

/* ---------- bone map ---------- */
const map = { Bip01: 'Hips', Bip01_Pelvis: 'Hips', Bip01_Spine: 'Spine', Bip01_Spine1: 'Spine1', Bip01_Spine2: 'Spine2',
  Bip01_Neck: 'Neck', Bip01_Head: 'Head', Bip01_LEye: 'LeftEye', Bip01_REye: 'RightEye' };
const fingers = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
for (const [s, S] of [['L', 'Left'], ['R', 'Right']]) {
  Object.assign(map, {
    [`Bip01_${s}_Clavicle`]: `${S}Shoulder`, [`Bip01_${s}_UpperArm`]: `${S}Arm`, [`Bip01_${s}_Forearm`]: `${S}ForeArm`,
    [`Bip01_${s}_Hand`]: `${S}Hand`, [`Bip01_${s}_Thigh`]: `${S}UpLeg`, [`Bip01_${s}_Calf`]: `${S}Leg`,
    [`Bip01_${s}_Foot`]: `${S}Foot`, [`Bip01_${s}_Toe0`]: `${S}ToeBase`,
  });
  fingers.forEach((f, i) => {
    map[`Bip01_${s}_Finger${i}`] = `${S}Hand${f}1`;
    map[`Bip01_${s}_Finger${i}1`] = `${S}Hand${f}2`;
    map[`Bip01_${s}_Finger${i}2`] = `${S}Hand${f}3`;
  });
}
const inv = {};
for (const [k, v] of Object.entries(map)) if (k !== 'Bip01') inv[v] = k;

/* ---------- new skeleton positions ---------- */
const names = Object.keys(ref); // RPM order
const pos = {};
for (const n of names) if (inv[n]) pos[n] = rbPos(inv[n]);
// Synthesised end bones.
const refV = (n) => new THREE.Vector3().fromArray(ref[n].p);
const heightRatio = (pos.Head.y - pos.Hips.y) / (refV('Head').y - refV('Hips').y);
pos.HeadTop_End = pos.Head.clone().add(refV('HeadTop_End').sub(refV('Head')).multiplyScalar(heightRatio));
for (const S of ['Left', 'Right']) {
  for (const f of fingers) {
    const a = pos[`${S}Hand${f}2`], b = pos[`${S}Hand${f}3`];
    pos[`${S}Hand${f}4`] = b.clone().add(b.clone().sub(a).multiplyScalar(0.85));
  }
  // Toe end: RPM offset from toe base, scaled.
  pos[`${S}Toe_End`] = pos[`${S}ToeBase`].clone().add(refV(`${S}Toe_End`).sub(refV(`${S}ToeBase`)).multiplyScalar(heightRatio));
}
for (const n of names) if (!pos[n]) throw new Error('no position for ' + n);

/* ---------- orientations: RPM rest, aligned to this body's limbs ---------- */
const primaryChild = {};
for (const n of names) {
  const kids = names.filter((k) => ref[k].parent === n);
  if (!kids.length) continue;
  const pick = { Hips: 'Spine', Spine2: 'Neck', Head: 'HeadTop_End', LeftHand: 'LeftHandMiddle1', RightHand: 'RightHandMiddle1' }[n];
  primaryChild[n] = pick || kids[0];
}
const worldQ = {};
for (const n of names) {
  const q = new THREE.Quaternion().fromArray(ref[n].q);
  const c = primaryChild[n];
  if (c) {
    const dRef = refV(c).sub(refV(n)).normalize();
    const dNew = pos[c].clone().sub(pos[n]).normalize();
    q.premultiply(new THREE.Quaternion().setFromUnitVectors(dRef, dNew));
  }
  worldQ[n] = q;
}
const worldM = {};
for (const n of names) worldM[n] = new THREE.Matrix4().compose(pos[n], worldQ[n], new THREE.Vector3(1, 1, 1));
const localM = {};
for (const n of names) {
  const p = ref[n].parent;
  localM[n] = p && worldM[p] ? worldM[p].clone().invert().multiply(worldM[n]) : worldM[n].clone();
}

/* ---------- geometry ---------- */
// Bake the bind matrix (Z-up -> Y-up) and scale into positions, normals and morphs.
const g0 = mesh.geometry.clone();
const bake = mesh.bindMatrix.clone().premultiply(new THREE.Matrix4().makeScale(SCALE, SCALE, SCALE));
g0.applyMatrix4(bake); // positions + normals
const rot = new THREE.Matrix4().extractRotation(mesh.bindMatrix);
const morphKeep = [];
const morphName = (raw) => {
  const n = raw.replace(/^blendShape1\./, '');
  let m = n.match(/^AK_\d+_(.+)$/);
  if (m) return m[1][0].toLowerCase() + m[1].slice(1);
  m = n.match(/^AA_VI_\d+_(.+)$/);
  if (m) {
    const v = { Sil: 'sil', KK: 'kk', nn: 'nn' }[m[1]] || m[1];
    return 'viseme_' + v;
  }
  return null;
};
const srcMorphs = g0.morphAttributes.position;
for (const a of srcMorphs) {
  const nm = morphName(a.name);
  if (!nm) continue;
  // morph deltas: rotate + scale (relative targets)
  const arr = a.array.slice();
  const v = new THREE.Vector3();
  for (let i = 0; i < arr.length; i += 3) {
    v.fromArray(arr, i).applyMatrix4(rot).multiplyScalar(SCALE).toArray(arr, i);
  }
  const attr = new THREE.BufferAttribute(arr, 3);
  attr.name = nm;
  morphKeep.push(attr);
}
g0.morphAttributes = { position: morphKeep };
g0.morphTargetsRelative = true;
g0.deleteAttribute('color');

// Remap skin to new bones (unmapped bones fold into nearest mapped ancestor).
const newIndex = Object.fromEntries(names.map((n, i) => [n, i]));
const rbToNew = rbBones.map((b) => {
  let o = b;
  while (o && !map[o.name]) o = o.parent;
  return newIndex[map[o ? o.name : 'Bip01']];
});
const si = g0.attributes.skinIndex, sw = g0.attributes.skinWeight;
const nsi = new Uint16Array(si.count * 4), nsw = new Float32Array(si.count * 4);
for (let i = 0; i < si.count; i++) {
  const acc = new Map();
  for (let k = 0; k < 4; k++) {
    const w = sw.getComponent(i, k);
    if (w <= 0) continue;
    const j = rbToNew[si.getComponent(i, k)];
    acc.set(j, (acc.get(j) || 0) + w);
  }
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const tot = top.reduce((s, x) => s + x[1], 0) || 1;
  top.forEach(([j, w], k) => { nsi[i * 4 + k] = j; nsw[i * 4 + k] = w / tot; });
}
g0.setAttribute('skinIndex', new THREE.BufferAttribute(nsi, 4));
g0.setAttribute('skinWeight', new THREE.BufferAttribute(nsw, 4));
// glTF UV origin is top-left.
const uv = g0.attributes.uv;
for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));

// Split by material into two primitives, each indexed.
function subGeometry(matIndex) {
  const tris = [];
  for (const gr of g0.groups) if (gr.materialIndex === matIndex) for (let i = gr.start; i < gr.start + gr.count; i++) tris.push(i);
  const g = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(g0.attributes)) {
    const C = a.array.constructor, out = new C(tris.length * a.itemSize);
    tris.forEach((v, i) => { for (let c = 0; c < a.itemSize; c++) out[i * a.itemSize + c] = a.array[v * a.itemSize + c]; });
    g.setAttribute(k, new THREE.BufferAttribute(out, a.itemSize, a.normalized));
  }
  if (matIndex === 1) {
    g.morphAttributes.position = morphKeep.map((a) => {
      const out = new Float32Array(tris.length * 3);
      tris.forEach((v, i) => { out[i * 3] = a.array[v * 3]; out[i * 3 + 1] = a.array[v * 3 + 1]; out[i * 3 + 2] = a.array[v * 3 + 2]; });
      const b = new THREE.BufferAttribute(out, 3); b.name = a.name; return b;
    });
    g.morphTargetsRelative = true;
  }
  return mergeVertices(g, 1e-5);
}
const body = subGeometry(0), head = subGeometry(1);

/* ---------- glasses (frames + faint lenses), rigid on the head ---------- */
const G = JSON.parse(process.env.GLASSES || 'null');
function glassesGeometry() {
  const eL = pos.LeftEye, eR = pos.RightEye;
  const cy = (eL.y + eR.y) / 2 + G.dy, ez = (eL.z + eR.z) / 2;
  const hw = G.w / 2, hh = G.h / 2, r = G.r;
  const frames = [], lenses = [];
  for (const side of [1, -1]) {
    const cx = side * (Math.abs(eL.x) + G.dx);
    // Rounded rectangle, slightly wrapped: the outer edge sits further back.
    const pts = [];
    const N = 48;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t), sn = Math.sin(t);
      // superellipse for a modern rectangular-round frame
      const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / G.n) * hw;
      const ey = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / G.n) * hh * (sn < 0 ? G.lower : 1);
      const outer = (ex * side) / hw; // -1 inner .. 1 outer
      const z = ez + G.z - Math.max(0, outer) * G.wrap - (ey < 0 ? -ey * G.tilt : 0);
      pts.push(new THREE.Vector3(cx + ex, cy + ey, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    frames.push(new THREE.TubeGeometry(curve, 96, r, 6, true));
    // lens: fan from centre
    const lp = curve.getPoints(64);
    const verts = [cx, cy, ez + G.z - 0.001];
    lp.forEach((v) => verts.push(v.x, v.y, v.z - 0.0005));
    const idx = [];
    for (let i = 1; i < lp.length; i++) idx.push(0, i, i + 1);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    lg.setIndex(idx); lg.computeVertexNormals();
    lenses.push(lg);
    // temple arm, from the outer top corner back to the ear
    const ox = side * (Math.abs(cx) + hw * 0.98);
    const arm = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ox, cy + hh * 0.55, ez + G.z - G.wrap),
      new THREE.Vector3(side * (Math.abs(ox) + G.armOut * 0.6), cy + hh * 0.45, ez + G.z - G.wrap - 0.02),
      new THREE.Vector3(side * (Math.abs(ox) + G.armOut), cy + hh * 0.2, ez - G.armBack * 0.6),
      new THREE.Vector3(side * (Math.abs(ox) + G.armOut), cy - 0.002, ez - G.armBack),
      new THREE.Vector3(side * (Math.abs(ox) + G.armOut - 0.004), cy - 0.02, ez - G.armBack - 0.018),
    ]);
    frames.push(new THREE.TubeGeometry(arm, 40, r * 0.8, 6, false));
  }
  // bridge
  const ix = Math.abs(eL.x) + G.dx - hw;
  const bridge = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ix + 0.001, cy + hh * 0.35, ez + G.z),
    new THREE.Vector3(0, cy + hh * 0.5, ez + G.z + 0.004),
    new THREE.Vector3(-ix - 0.001, cy + hh * 0.35, ez + G.z),
  ]);
  frames.push(new THREE.TubeGeometry(bridge, 20, r * 0.85, 6, false));
  const strip = (g) => { const o = g.toNonIndexed ? g : g; ['uv'].forEach((k) => o.deleteAttribute(k)); return o; };
  return { frame: mergeGeometries(frames.map(strip)), lens: mergeGeometries(lenses) };
}
const glasses = G ? glassesGeometry() : null;

console.log('verts body', body.attributes.position.count, 'head', head.attributes.position.count, 'tris', (body.index.count + head.index.count) / 3, 'morphs', morphKeep.length);

/* ---------- textures ---------- */
const tga = new TGALoader();
async function tex(file, quality, size = TEX) {
  const b = fs.readFileSync(`${texDir}/${file}`);
  const t = tga.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  return sharp(Buffer.from(t.data.buffer), { raw: { width: t.width, height: t.height, channels: 4 } })
    .removeAlpha().resize(size, size).jpeg({ quality, mozjpeg: true }).toBuffer();
}
const imgs = {
  bodyC: await tex(`${prefix}_body_color.tga`, 82), bodyN: await tex(`${prefix}_body_normal.tga`, 80),
  headC: await tex(`${prefix}_head_color.tga`, 84, 1536), headN: await tex(`${prefix}_head_normal.tga`, 82),
};
if (process.env.DUMP) for (const [k, v] of Object.entries(imgs)) fs.writeFileSync(`${process.env.DUMP}/${k}.jpg`, v);

/* ---------- GLB writer ---------- */
const chunks = []; let byteLen = 0;
const json = { asset: { version: '2.0', generator: 'rocketbox-to-talkinghead' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [], meshes: [], accessors: [], bufferViews: [], materials: [], textures: [], images: [], samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }], skins: [] };
function view(data, target) {
  const pad = (4 - (byteLen % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); byteLen += pad; }
  const b = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  json.bufferViews.push({ buffer: 0, byteOffset: byteLen, byteLength: b.length, ...(target ? { target } : {}) });
  chunks.push(b); byteLen += b.length; return json.bufferViews.length - 1;
}
const CT = { Float32Array: 5126, Uint16Array: 5123, Uint32Array: 5125, Uint8Array: 5121 };
const TYPE = { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4', 16: 'MAT4' };
function accessor(arr, size, target, minmax) {
  const a = { bufferView: view(arr, target), componentType: CT[arr.constructor.name], count: arr.length / size, type: TYPE[size] };
  if (minmax) {
    const mn = Array(size).fill(Infinity), mx = Array(size).fill(-Infinity);
    for (let i = 0; i < arr.length; i++) { mn[i % size] = Math.min(mn[i % size], arr[i]); mx[i % size] = Math.max(mx[i % size], arr[i]); }
    a.min = mn; a.max = mx;
  }
  json.accessors.push(a); return json.accessors.length - 1;
}
function sparseMorph(arr, count) {
  const idx = [], vals = [];
  for (let i = 0; i < count; i++) {
    const x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2];
    if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 1e-6) { idx.push(i); vals.push(x, y, z); }
  }
  const mn = [0, 0, 0], mx = [0, 0, 0];
  for (let i = 0; i < vals.length; i++) { mn[i % 3] = Math.min(mn[i % 3], vals[i]); mx[i % 3] = Math.max(mx[i % 3], vals[i]); }
  const a = { componentType: 5126, count, type: 'VEC3', min: mn, max: mx };
  if (idx.length) {
    const I = count < 65536 ? new Uint16Array(idx) : new Uint32Array(idx);
    a.sparse = { count: idx.length, indices: { bufferView: view(I), componentType: CT[I.constructor.name] }, values: { bufferView: view(new Float32Array(vals)) } };
  }
  json.accessors.push(a); return json.accessors.length - 1;
}
function image(b) { json.images.push({ bufferView: view(new Uint8Array(b)), mimeType: 'image/jpeg' }); json.textures.push({ sampler: 0, source: json.images.length - 1 }); return json.textures.length - 1; }
const mat = (name, c, n, rough) => { json.materials.push({ name, pbrMetallicRoughness: { baseColorTexture: { index: image(c) }, metallicFactor: 0, roughnessFactor: rough }, normalTexture: { index: image(n), scale: 1 } }); return json.materials.length - 1; };
const matBody = mat('body', imgs.bodyC, imgs.bodyN, 0.72);
const matHead = mat('head', imgs.headC, imgs.headN, 0.58);

function prim(g, material) {
  const a = g.attributes;
  const p = { attributes: {
    POSITION: accessor(new Float32Array(a.position.array), 3, 34962, true),
    NORMAL: accessor(normalize(new Float32Array(a.normal.array)), 3, 34962),
    TEXCOORD_0: accessor(new Float32Array(a.uv.array), 2, 34962),
    JOINTS_0: accessor(new Uint16Array(a.skinIndex.array), 4, 34962),
    WEIGHTS_0: accessor(new Float32Array(a.skinWeight.array), 4, 34962),
  }, indices: accessor(a.position.count < 65536 ? new Uint16Array(g.index.array) : new Uint32Array(g.index.array), 1, 34963), material };
  if (g.morphAttributes.position?.length) p.targets = g.morphAttributes.position.map((m) => ({ POSITION: sparseMorph(m.array, a.position.count) }));
  return p;
}
function normalize(arr) { for (let i = 0; i < arr.length; i += 3) { const l = Math.hypot(arr[i], arr[i + 1], arr[i + 2]) || 1; arr[i] /= l; arr[i + 1] /= l; arr[i + 2] /= l; } return arr; }

// Nodes: 0 Armature, 1.. bones, then meshes.
json.nodes.push({ name: 'Armature', children: [] });
const boneNode = {};
names.forEach((n) => { boneNode[n] = json.nodes.length; const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); localM[n].decompose(p, q, s); json.nodes.push({ name: n, translation: p.toArray(), rotation: q.toArray() }); });
names.forEach((n) => { const p = ref[n].parent; (p && boneNode[p] !== undefined ? json.nodes[boneNode[p]] : json.nodes[0]).children ??= []; (p && boneNode[p] !== undefined ? json.nodes[boneNode[p]] : json.nodes[0]).children.push(boneNode[n]); });
const ibm = new Float32Array(names.length * 16);
names.forEach((n, i) => worldM[n].clone().invert().toArray(ibm, i * 16));
json.skins.push({ joints: names.map((n) => boneNode[n]), inverseBindMatrices: accessor(ibm, 16), skeleton: boneNode.Hips });
json.meshes.push({ name: 'Body', primitives: [prim(body, matBody)] });
json.meshes.push({ name: 'Head', primitives: [prim(head, matHead)], extras: { targetNames: morphKeep.map((m) => m.name) } });
json.nodes.push({ name: 'AvatarBody', mesh: 0, skin: 0 }); json.nodes[0].children.push(json.nodes.length - 1);
json.nodes.push({ name: 'AvatarHead', mesh: 1, skin: 0 }); json.nodes[0].children.push(json.nodes.length - 1);

function rigidPrim(g, material) {
  const n = g.attributes.position.count;
  const J = new Uint16Array(n * 4), W = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { J[i * 4] = newIndex.Head; W[i * 4] = 1; }
  const idx = g.index.array;
  return { attributes: {
    POSITION: accessor(new Float32Array(g.attributes.position.array), 3, 34962, true),
    NORMAL: accessor(normalize(new Float32Array(g.attributes.normal.array)), 3, 34962),
    JOINTS_0: accessor(J, 4, 34962), WEIGHTS_0: accessor(W, 4, 34962),
  }, indices: accessor(n < 65536 ? new Uint16Array(idx) : new Uint32Array(idx), 1, 34963), material };
}
if (glasses) {
  json.materials.push({ name: 'frame', pbrMetallicRoughness: { baseColorFactor: G.color, metallicFactor: 0, roughnessFactor: 0.5 } });
  const mFrame = json.materials.length - 1;
  json.materials.push({ name: 'lens', alphaMode: 'BLEND', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.85, 0.9, 1, 0.08], metallicFactor: 0, roughnessFactor: 0.04 } });
  const mLens = json.materials.length - 1;
  json.meshes.push({ name: 'Glasses', primitives: [rigidPrim(glasses.frame, mFrame), rigidPrim(glasses.lens, mLens)] });
  json.nodes.push({ name: 'AvatarGlasses', mesh: json.meshes.length - 1, skin: 0 }); json.nodes[0].children.push(json.nodes.length - 1);
}


const bin = Buffer.concat(chunks); const binPad = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
json.buffers = [{ byteLength: binPad.length }];
let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + js.length + 8 + binPad.length, 8);
const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
fs.writeFileSync(outGlb, Buffer.concat([header, ch(js.length, 0x4e4f534a), js, ch(binPad.length, 0x004e4942), binPad]));
console.log('wrote', outGlb, (fs.statSync(outGlb).size / 1e6).toFixed(2), 'MB', 'textures', Object.values(imgs).map((b) => (b.length / 1e3).toFixed(0) + 'KB').join(' '));
