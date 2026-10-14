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
