// 2D drawings that become textures on the 3D planes: the hero's exploded
// layers and the screens in the project viewer. Everything is drawn with the
// canvas API so there are no image assets to load.
import * as THREE from "three";
import { C, FONT } from "./palette.js";

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
const fillRR = (ctx, x, y, w, h, r, color) => {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
};
const strokeRR = (ctx, x, y, w, h, r, color, lw = 2) => {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
};
const text = (ctx, str, x, y, size, color, weight = 500, stretch = 100, align = "left") => {
  // `font-stretch` in the canvas font shorthand only accepts keywords, so the
  // width axis is mapped to the nearest keyword.
  const kw =
    stretch >= 125
      ? "ultra-expanded"
      : stretch >= 112
        ? "expanded"
        : stretch <= 75
          ? "condensed"
          : stretch <= 87
            ? "semi-condensed"
            : "normal";
  ctx.font = `${weight} ${size}px ${FONT}`;
  try {
    ctx.fontStretch = kw;
  } catch {
    /* older browsers ignore the width axis */
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(str, x, y);
  try {
    ctx.fontStretch = "normal";
  } catch {
    /* noop */
  }
};
const bar = (ctx, x, y, w, h, color) => fillRR(ctx, x, y, w, h, h / 2, color);

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTexture(canvas, renderer) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/* ------------------------------------------------------------------ */
/* Hero layers                                                         */
/* ------------------------------------------------------------------ */

// Each layer is drawn on a transparent canvas so the layers below show
// through, the way they would in a design tool's exploded view.
const LAYER_W = 1024;
const LAYER_H = 640;

function layerFrame(ctx, label, tint) {
  ctx.clearRect(0, 0, LAYER_W, LAYER_H);
  strokeRR(ctx, 6, 6, LAYER_W - 12, LAYER_H - 12, 28, tint, 4);
  // Name tab on the layer's top edge, like a frame label in a design tool.
  ctx.font = `700 30px ${FONT}`;
  const tw = ctx.measureText(label).width;
  fillRR(ctx, 28, 24, tw + 40, 48, 24, tint);
  text(ctx, label, 48, 58, 30, tint === C.yellow ? C.ink : C.paperHi, 700);
}

const drawers = {
  data(ctx) {
    layerFrame(ctx, "Data", C.ink);
    ctx.fillStyle = "rgba(21,18,58,0.10)";
    rr(ctx, 6, 6, LAYER_W - 12, LAYER_H - 12, 28);
    ctx.fill();
    // A table of records with an index column highlighted.
    const x0 = 70;
    const y0 = 130;
    const cols = [150, 260, 220, 200];
    for (let r = 0; r < 7; r++) {
      let x = x0;
      const y = y0 + r * 62;
      cols.forEach((cw, ci) => {
        const isIndex = ci === 0;
        const color = r === 0 ? C.ink : isIndex ? C.cobalt : "rgba(21,18,58,0.35)";
        bar(ctx, x, y + 18, cw * (r === 0 ? 0.55 : 0.4 + ((r * 7 + ci * 3) % 5) * 0.11), 16, color);
        x += cw + 20;
      });
      if (r > 0) {
        ctx.fillStyle = "rgba(21,18,58,0.18)";
        ctx.fillRect(x0, y + 56, 880, 2);
      }
    }
    text(ctx, "p95 −25%", LAYER_W - 70, LAYER_H - 50, 34, C.cobalt, 800, 125, "right");
  },
  logic(ctx) {
    layerFrame(ctx, "Logic", C.cobalt);
    ctx.fillStyle = "rgba(43,58,245,0.10)";
    rr(ctx, 6, 6, LAYER_W - 12, LAYER_H - 12, 28);
    ctx.fill();
    // Request flow: client → auth → role check → API
    const nodes = [
      { x: 90, y: 260, w: 180, label: "Request" },
      { x: 330, y: 160, w: 170, label: "JWT" },
      { x: 330, y: 360, w: 170, label: "Refresh" },
      { x: 560, y: 260, w: 170, label: "Role" },
      { x: 790, y: 260, w: 150, label: "API" },
    ];
    ctx.strokeStyle = C.cobalt;
    ctx.lineWidth = 5;
    const link = (a, b) => {
      ctx.beginPath();
      ctx.moveTo(a.x + a.w, a.y + 40);
      const mx = (a.x + a.w + b.x) / 2;
      ctx.bezierCurveTo(mx, a.y + 40, mx, b.y + 40, b.x, b.y + 40);
      ctx.stroke();
    };
    link(nodes[0], nodes[1]);
    link(nodes[0], nodes[2]);
    link(nodes[1], nodes[3]);
    link(nodes[2], nodes[3]);
    link(nodes[3], nodes[4]);
    nodes.forEach((n, i) => {
      fillRR(ctx, n.x, n.y, n.w, 80, 20, i === 3 ? C.cobalt : C.paperHi);
      strokeRR(ctx, n.x, n.y, n.w, 80, 20, C.cobalt, 4);
      text(ctx, n.label, n.x + n.w / 2, n.y + 52, 30, i === 3 ? C.paperHi : C.ink, 700, 100, "center");
    });
  },
  layout(ctx) {
    layerFrame(ctx, "Layout", C.inkSoft);
    ctx.setLineDash([14, 10]);
    const s = (x, y, w, h) => strokeRR(ctx, x, y, w, h, 14, C.inkSoft, 3);
    s(60, 100, 904, 70); // nav
    s(60, 200, 560, 230); // hero
    s(650, 200, 314, 230); // aside
    s(60, 460, 280, 130);
    s(372, 460, 280, 130);
    s(684, 460, 280, 130);
    ctx.setLineDash([]);
    // grid columns
    ctx.fillStyle = "rgba(74,70,114,0.08)";
    for (let i = 0; i < 12; i++) ctx.fillRect(60 + i * 77, 100, 60, 490);
  },
  style(ctx) {
    layerFrame(ctx, "Style", C.yellow);
    // Colour swatches, a type sample and a couple of buttons.
    [C.ink, C.cobalt, C.yellow, C.paperHi].forEach((c, i) => {
      fillRR(ctx, 70 + i * 104, 110, 88, 88, 44, c);
      if (c === C.paperHi) strokeRR(ctx, 70 + i * 104, 110, 88, 88, 44, C.mist, 3);
    });
    text(ctx, "Aa", 520, 205, 120, C.ink, 800, 125);
    text(ctx, "Archivo 125 / 800", 700, 190, 26, C.inkSoft, 600);
    fillRR(ctx, 70, 270, 300, 86, 43, C.cobalt);
    text(ctx, "Save changes", 220, 324, 32, C.paperHi, 700, 100, "center");
    strokeRR(ctx, 396, 270, 260, 86, 43, C.ink, 4);
    text(ctx, "Cancel", 526, 324, 32, C.ink, 700, 100, "center");
    // A card
    fillRR(ctx, 70, 390, 586, 190, 24, C.paperHi);
    strokeRR(ctx, 70, 390, 586, 190, 24, C.mist, 3);
    bar(ctx, 100, 425, 300, 22, C.ink);
    bar(ctx, 100, 470, 480, 14, "rgba(21,18,58,0.35)");
    bar(ctx, 100, 500, 420, 14, "rgba(21,18,58,0.35)");
    fillRR(ctx, 100, 532, 110, 30, 15, C.yellow);
    // toggle
    fillRR(ctx, 700, 280, 140, 70, 35, C.cobalt);
    fillRR(ctx, 776, 288, 56, 54, 27, C.paperHi);
    fillRR(ctx, 700, 390, 260, 190, 24, C.ink);
    text(ctx, "4.5:1", 830, 510, 64, C.yellow, 800, 125, "center");
  },
  motion(ctx) {
    layerFrame(ctx, "Motion", C.cobalt);
    // Easing curve with keyframes, and a cursor.
    ctx.strokeStyle = "rgba(21,18,58,0.2)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(80, 140 + i * 100);
      ctx.lineTo(940, 140 + i * 100);
      ctx.stroke();
    }
    ctx.strokeStyle = C.cobalt;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 540);
    ctx.bezierCurveTo(420, 540, 420, 140, 940, 140);
    ctx.stroke();
    [
      [80, 540],
      [940, 140],
    ].forEach(([x, y]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = C.yellow;
      ctx.fillRect(-18, -18, 36, 36);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 4;
      ctx.strokeRect(-18, -18, 36, 36);
      ctx.restore();
    });
    // cursor arrow
    ctx.save();
    ctx.translate(560, 300);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 74);
    ctx.lineTo(20, 56);
    ctx.lineTo(34, 86);
    ctx.lineTo(46, 80);
    ctx.lineTo(32, 52);
    ctx.lineTo(58, 52);
    ctx.closePath();
    ctx.fillStyle = C.ink;
    ctx.fill();
    ctx.strokeStyle = C.paperHi;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    text(ctx, "cubic-bezier(.6, 0, .2, 1)", 940, 600, 28, C.inkSoft, 600, 100, "right");
  },
};

export function makeLayerTexture(key, renderer) {
  const c = makeCanvas(LAYER_W, LAYER_H);
  drawers[key](c.getContext("2d"));
  return canvasTexture(c, renderer);
}
export const LAYER_ASPECT = LAYER_W / LAYER_H;

/* ------------------------------------------------------------------ */
/* Finished screen (shown on the laptop once the layers collapse)       */
/* ------------------------------------------------------------------ */

export function makeScreenTexture(renderer) {
  const W = 1024;
  const H = 640;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = C.paperHi;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, 80);
  bar(ctx, 40, 32, 140, 18, C.ink);
  [600, 700, 800].forEach((x) => bar(ctx, x, 34, 70, 14, C.inkSoft));
  fillRR(ctx, 880, 22, 110, 38, 19, C.cobalt);
  text(ctx, "Nirbyoleek", 40, 225, 84, C.ink, 800, 100);
  text(ctx, "Das", 40, 315, 84, C.cobalt, 800, 100);
  bar(ctx, 40, 380, 420, 16, "rgba(21,18,58,0.4)");
  bar(ctx, 40, 410, 360, 16, "rgba(21,18,58,0.4)");
  fillRR(ctx, 40, 460, 220, 64, 32, C.cobalt);
  strokeRR(ctx, 280, 460, 200, 64, 32, C.ink, 4);
  fillRR(ctx, 600, 140, 380, 400, 28, C.ink);
  fillRR(ctx, 640, 180, 300, 200, 18, C.cobalt);
  fillRR(ctx, 640, 400, 140, 100, 18, C.yellow);
  fillRR(ctx, 800, 400, 140, 100, 18, C.paperHi);
  return canvasTexture(c, renderer);
}

/* ------------------------------------------------------------------ */
/* Project screens                                                     */
/* ------------------------------------------------------------------ */

const PW = 1024;
const PH = 720;

function browserChrome(ctx, title) {
  fillRR(ctx, 0, 0, PW, PH, 34, C.paperHi);
  ctx.save();
  rr(ctx, 0, 0, PW, PH, 34);
  ctx.clip();
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PW, 64);
  [C.red, C.yellow, C.green].forEach((col, i) => fillRR(ctx, 30 + i * 30, 24, 16, 16, 8, col));
  fillRR(ctx, 150, 16, 520, 32, 16, C.paperHi);
  text(ctx, title, 172, 40, 18, C.inkSoft, 500);
  ctx.restore();
}

const projectMocks = {
  wk(ctx) {
    browserChrome(ctx, "app.client / workspace");
    // Two app panes side by side, tied by an API contract.
    fillRR(ctx, 40, 100, 440, 560, 22, C.paper);
    fillRR(ctx, 544, 100, 440, 560, 22, C.paper);
    text(ctx, "App 1", 70, 150, 34, C.ink, 800, 125);
    text(ctx, "App 2", 574, 150, 34, C.ink, 800, 125);
    for (let i = 0; i < 4; i++) {
      fillRR(ctx, 70, 190 + i * 100, 380, 76, 16, C.paperHi);
      bar(ctx, 96, 214 + i * 100, 180 - i * 20, 14, C.ink);
      bar(ctx, 96, 240 + i * 100, 260, 10, C.mist);
      fillRR(ctx, 574, 190 + i * 100, 380, 76, 16, i === 1 ? C.cobalt : C.paperHi);
      bar(ctx, 600, 214 + i * 100, 200, 14, i === 1 ? C.paperHi : C.ink);
      bar(ctx, 600, 240 + i * 100, 240, 10, i === 1 ? C.cobaltSoft : C.mist);
    }
    fillRR(ctx, 412, 600, 200, 56, 28, C.yellow);
    text(ctx, "API contract", 512, 636, 22, C.ink, 700, 100, "center");
  },
  kms(ctx) {
    browserChrome(ctx, "knowledge / search");
    fillRR(ctx, 40, 96, 944, 84, 42, C.paper);
    text(ctx, "forklift safety training", 90, 150, 32, C.ink, 600);
    fillRR(ctx, 850, 108, 120, 60, 30, C.cobalt);
    // tag chips
    ["Training", "Ops", "EMEA", "v3"].forEach((t, i) => {
      fillRR(ctx, 40 + i * 150, 205, 136, 44, 22, i === 0 ? C.ink : C.paper);
      text(ctx, t, 108 + i * 150, 235, 20, i === 0 ? C.paperHi : C.ink, 600, 100, "center");
    });
    for (let i = 0; i < 4; i++) {
      const y = 280 + i * 100;
      fillRR(ctx, 40, y, 944, 84, 18, i === 0 ? "#FFF3CF" : C.paperHi);
      strokeRR(ctx, 40, y, 944, 84, 18, C.mist, 2);
      fillRR(ctx, 64, y + 18, 48, 48, 10, i === 0 ? C.yellow : C.paper);
      bar(ctx, 136, y + 24, 360 - i * 30, 16, C.ink);
      bar(ctx, 136, y + 52, 560, 10, C.mist);
    }
    text(ctx, "−40% retrieval time", 984, 700, 26, C.cobalt, 800, 112, "right");
  },
  slp(ctx) {
    browserChrome(ctx, "support-load / shipments");
    // KPI row
    ["In transit", "Delayed", "Delivered"].forEach((t, i) => {
      fillRR(ctx, 40 + i * 320, 96, 296, 120, 20, i === 1 ? C.ink : C.paper);
      text(ctx, t, 66 + i * 320, 136, 22, i === 1 ? C.mist : C.inkSoft, 600);
      text(ctx, ["1,284", "37", "9,602"][i], 66 + i * 320, 192, 48, i === 1 ? C.yellow : C.ink, 800, 112);
    });
    // Route map line
    fillRR(ctx, 40, 240, 944, 200, 20, C.paper);
    ctx.strokeStyle = C.cobalt;
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(100, 400);
    ctx.bezierCurveTo(300, 260, 520, 420, 700, 300);
    ctx.lineTo(920, 280);
    ctx.stroke();
    ctx.setLineDash([]);
    [
      [100, 400],
      [700, 300],
      [920, 280],
    ].forEach(([x, y], i) => fillRR(ctx, x - 14, y - 14, 28, 28, 14, i === 1 ? C.yellow : C.cobalt));
    // table rows
    for (let i = 0; i < 3; i++) {
      const y = 465 + i * 74;
      fillRR(ctx, 40, y, 944, 60, 14, C.paperHi);
      strokeRR(ctx, 40, y, 944, 60, 14, C.mist, 2);
      bar(ctx, 64, y + 23, 160, 14, C.ink);
      bar(ctx, 280, y + 23, 260, 12, C.mist);
      fillRR(ctx, 820, y + 14, 130, 32, 16, [C.green, C.red, C.cobalt][i]);
    }
  },
  chat(ctx) {
    browserChrome(ctx, "chat / #frontend");
    fillRR(ctx, 40, 96, 250, 584, 20, C.ink);
    ["# general", "# frontend", "# random", "@ priya"].forEach((t, i) => {
      if (i === 1) fillRR(ctx, 56, 124 + i * 64, 218, 48, 12, C.cobalt);
      text(ctx, t, 76, 156 + i * 64, 24, i === 1 ? C.paperHi : C.mist, 600);
    });
    const msgs = [
      { me: false, w: 360 },
      { me: true, w: 300 },
      { me: false, w: 440 },
      { me: true, w: 220 },
    ];
    msgs.forEach((m, i) => {
      const y = 120 + i * 112;
      const x = m.me ? 960 - m.w : 320;
      fillRR(ctx, x, y, m.w, 84, 26, m.me ? C.cobalt : C.paper);
      bar(ctx, x + 28, y + 26, m.w * 0.7, 12, m.me ? C.paperHi : C.ink);
      bar(ctx, x + 28, y + 50, m.w * 0.45, 12, m.me ? C.cobaltSoft : C.mist);
    });
    text(ctx, "Priya is typing…", 320, 600, 22, C.inkSoft, 500);
    fillRR(ctx, 320, 620, 640, 56, 28, C.paper);
  },
  twitter(ctx) {
    browserChrome(ctx, "feed / home");
    for (let i = 0; i < 4; i++) {
      const y = 96 + i * 150;
      fillRR(ctx, 120, y, 784, 134, 20, i === 0 ? C.paper : C.paperHi);
      strokeRR(ctx, 120, y, 784, 134, 20, C.mist, 2);
      fillRR(ctx, 146, y + 24, 60, 60, 30, [C.cobalt, C.yellow, C.ink, C.cobaltSoft][i]);
      bar(ctx, 230, y + 30, 180, 16, C.ink);
      bar(ctx, 230, y + 62, 560, 12, C.mist);
      bar(ctx, 230, y + 84, 420, 12, C.mist);
      [0, 1, 2].forEach((k) => fillRR(ctx, 230 + k * 120, y + 106, 70, 14, 7, k === 2 && i === 1 ? C.red : C.mist));
    }
  },
};

export function makeProjectTexture(project, renderer) {
  const c = makeCanvas(PW, PH);
  (projectMocks[project.mock] || projectMocks.wk)(c.getContext("2d"));
  return canvasTexture(c, renderer);
}
export const PROJECT_ASPECT = PW / PH;

/* ------------------------------------------------------------------ */
/* Keycap legends                                                      */
/* ------------------------------------------------------------------ */

export function makeKeyLegend(label, w, color, renderer) {
  const H = 160;
  const W = Math.round(H * w);
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  let size = 50;
  ctx.font = `700 ${size}px ${FONT}`;
  while (ctx.measureText(label).width > W - 36 && size > 20) {
    size -= 2;
    ctx.font = `700 ${size}px ${FONT}`;
  }
  text(ctx, label, 20, 30 + size, size, color, 700);
  return canvasTexture(c, renderer);
}
