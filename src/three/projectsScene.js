// A turntable of project screens. Drag (or swipe) to spin it, click a
// screen to bring it to the front; the front screen leans toward the cursor.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, prefersReducedMotion, isCoarsePointer } from "./stage.js";
import { makeProjectTexture, PROJECT_ASPECT } from "./mocks.js";
import { C } from "./palette.js";

export function createProjectsScene(container, { projects, onSelect }) {
  const reduced = prefersReducedMotion();
  const coarse = isCoarsePointer();
  let radius = 3.4;
  let camZ = 8.6;

  const stage = createStage(container, {
    fov: 30,
    onFrame: (dt, t) => frame(dt, t),
    onResize: ({ aspect }) => {
      // Narrow screens: pull the camera back so the front screen fits.
      camZ = aspect < 0.8 ? 15.5 : aspect < 1.4 ? 12.2 : 11.2;
      radius = aspect < 0.8 ? 3.0 : 3.4;
    },
  });
  const { scene, camera, renderer, pointer } = stage;

  scene.add(new THREE.HemisphereLight(C.paperHi, C.mist, 0.8));
  const key = new THREE.DirectionalLight("#ffffff", 2);
  key.position.set(-4, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
  key.shadow.radius = 5;
  scene.add(key);

  // Turntable base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.3, 4.4, 0.16, 96),
    new THREE.MeshStandardMaterial({ color: C.paperHi, roughness: 0.5 })
  );
  base.position.y = -1.42;
  base.receiveShadow = true;
  scene.add(base);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.36, 0.03, 8, 160),
    new THREE.MeshStandardMaterial({ color: C.cobalt, roughness: 0.3 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.34;
  scene.add(ring);
  const shadowFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ color: C.ink, opacity: 0.12 })
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -1.5;
  shadowFloor.receiveShadow = true;
  scene.add(shadowFloor);

  const carousel = new THREE.Group();
  scene.add(carousel);

  const W = 2.7;
  const H = W / PROJECT_ASPECT;
  const step = (Math.PI * 2) / projects.length;
  const frameGeo = new RoundedBoxGeometry(W + 0.14, H + 0.14, 0.09, 3, 0.08);
  const screenGeo = new THREE.PlaneGeometry(W, H);
  const standGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 12);

  const panels = projects.map((p, i) => {
    const holder = new THREE.Group(); // placed on the ring
    const lean = new THREE.Group(); // leans toward the cursor
    holder.add(lean);
    const frameMesh = new THREE.Mesh(
      frameGeo,
      new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.35 })
    );
    frameMesh.castShadow = true;
    const screen = new THREE.Mesh(
      screenGeo,
      new THREE.MeshBasicMaterial({ map: makeProjectTexture(p, renderer), toneMapped: false, transparent: true })
    );
    screen.position.z = 0.05;
    screen.userData.index = i;
    frameMesh.userData.index = i;
    lean.add(frameMesh, screen);
    const stand = new THREE.Mesh(standGeo, new THREE.MeshStandardMaterial({ color: C.ink }));
    stand.castShadow = true;
    holder.add(stand);
    carousel.add(holder);
    return { holder, lean, screen, frameMesh, stand, focus: 0 };
  });
  const hitList = panels.flatMap((p) => [p.screen, p.frameMesh]);

  let index = 0;
  let angle = 0; // current carousel rotation
  let target = 0;
  let drag = null;

  const setIndex = (i, notify = true) => {
    const n = projects.length;
    // Choose the rotation closest to the current angle that shows panel i.
    const base = -i * step;
    const k = Math.round((target - base) / (Math.PI * 2));
    target = base + k * Math.PI * 2;
    index = ((i % n) + n) % n;
    if (notify) onSelect?.(index);
  };

  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.style.cursor = "grab";
  const onDown = (e) => {
    drag = { x: e.clientX, moved: 0, startTarget: target };
    el.style.cursor = "grabbing";
  };
  const onMove = (e) => {
    if (drag) {
      const dx = e.clientX - drag.x;
      drag.moved = Math.abs(dx);
      target = drag.startTarget + (dx / Math.max(1, container.clientWidth)) * Math.PI * 1.4;
      return;
    }
    if (e.pointerType === "touch") return;
    const hit = stage.pick(e.clientX, e.clientY, hitList)[0];
    el.style.cursor = hit ? "pointer" : "grab";
  };
  const onUp = (e) => {
    if (!drag) return;
    const wasTap = drag.moved < 6;
    drag = null;
    el.style.cursor = "grab";
    if (wasTap) {
      const hit = stage.pick(e.clientX, e.clientY, hitList)[0];
      if (hit) setIndex(hit.object.userData.index);
      return;
    }
    // Snap to the nearest panel.
    const i = Math.round(-target / step);
    setIndex(i);
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  function frame(dt, t) {
    camera.position.set(pointer.sx * 0.35, 1.9 + pointer.sy * 0.25, camZ);
    camera.lookAt(0, 0.1, radius * 0.7);

    angle = drag ? target : damp(angle, target, reduced ? 30 : 6, dt);
    carousel.rotation.y = angle;

    panels.forEach((p, i) => {
      const a = i * step;
      p.holder.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
      p.holder.rotation.y = a;
      // How directly the panel faces the camera, 0..1
      const facing = Math.cos(a + angle);
      p.focus = damp(p.focus, i === index ? 1 : 0, 8, dt);
      const s = 0.7 + Math.max(0, facing) * 0.3;
      p.lean.scale.setScalar(s);
      const bob = reduced ? 0 : Math.sin(t * 1.1 + i) * 0.04;
      p.lean.position.y = 0.05 + bob + p.focus * 0.12;
      p.lean.rotation.y = p.focus * pointer.sx * 0.28;
      p.lean.rotation.x = p.focus * -pointer.sy * 0.16;
      p.stand.scale.y = 1.35 + p.lean.position.y;
      p.stand.position.y = -1.34 + p.stand.scale.y / 2;
      p.stand.position.z = -0.1;
      const dim = 0.45 + Math.max(0, facing) * 0.55;
      p.screen.material.color.setScalar(dim);
      p.screen.material.opacity = facing < -0.2 ? 0.25 : 1;
    });
  }

  setIndex(0, false);

  return {
    setIndex,
    dispose() {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stage.dispose();
    },
  };
}
