// Wraps the 2D drawings in lib/drawings.ts as three.js textures.
import * as THREE from "three";
import { drawKeyLegend, drawLayer, drawProject, drawScreen } from "../lib/drawings";

export { LAYER_ASPECT, PROJECT_ASPECT } from "../lib/drawings";

export function canvasTexture(canvas: HTMLCanvasElement, renderer?: THREE.WebGLRenderer): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export const makeLayerTexture = (key: string, renderer?: THREE.WebGLRenderer) => canvasTexture(drawLayer(key), renderer);
export const makeScreenTexture = (renderer?: THREE.WebGLRenderer) => canvasTexture(drawScreen(), renderer);
export const makeProjectTexture = (project: { mock: string }, renderer?: THREE.WebGLRenderer) =>
  canvasTexture(drawProject(project.mock), renderer);
export const makeKeyLegend = (label: string, w: number, color: string, renderer?: THREE.WebGLRenderer) =>
  canvasTexture(drawKeyLegend(label, w, color), renderer);

let shadowTex: THREE.CanvasTexture | null = null;

/**
 * A soft, round shadow decal to lay under an object. Cheaper and softer
 * than a real shadow map. Scale the mesh to size it.
 */
export function makeContactShadow(opacity = 0.35, color = "#15123A"): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  if (!shadowTex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    if (ctx) {
      // alphaMap reads brightness, so draw white-to-black on black.
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 128, 128);
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgb(255,255,255)");
      g.addColorStop(0.35, "rgb(158,158,158)");
      g.addColorStop(0.7, "rgb(46,46,46)");
      g.addColorStop(1, "rgb(0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color,
      alphaMap: shadowTex,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -1;
  return m;
}

let sweepTex: THREE.CanvasTexture | null = null;

/** A soft vertical band, bright in the middle, for light sweeps. */
export function makeSweepTexture(): THREE.CanvasTexture {
  if (sweepTex) return sweepTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 4;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, "rgb(0,0,0)");
    g.addColorStop(0.5, "rgb(255,255,255)");
    g.addColorStop(1, "rgb(0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 4);
  }
  sweepTex = new THREE.CanvasTexture(c);
  return sweepTex;
}
