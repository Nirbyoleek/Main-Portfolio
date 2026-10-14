// The hero: an interface taken apart into its layers, floating above the
// desk of a small avatar. Scrolling collapses the layers back into one
// finished screen; dragging spins the stack; hovering lifts a layer;
// clicking the avatar makes it wave.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createStage, damp, clamp, smoothstep, prefersReducedMotion, isCoarsePointer } from "./stage.js";
import { createAvatar } from "./avatar.js";
import { makeLayerTexture, makeScreenTexture, LAYER_ASPECT } from "./mocks.js";
import { C } from "./palette.js";

export function createHeroScene(container, opts) {
  const { layers, getProgress, onLayer, onAvatarClick, bubbleEl } = opts;
  const reduced = prefersReducedMotion();
  const coarse = isCoarsePointer();

  let layout = null;
  const stage = createStage(container, {
    fov: 30,
    onFrame: (dt, t) => frame(dt, t),
    onResize: ({ aspect }) => {
      layout = computeLayout(aspect);
    },
  });
  const { scene, camera, renderer, pointer } = stage;

  /* Lights ----------------------------------------------------------- */
  scene.add(new THREE.HemisphereLight(C.paperHi, C.mist, 0.75));
  const key = new THREE.DirectionalLight("#ffffff", 2.2);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.cobaltSoft, 1.4);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ color: C.ink, opacity: 0.14 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.18;
  ground.receiveShadow = true;
  scene.add(ground);

  /* Avatar ----------------------------------------------------------- */
  const avatar = createAvatar();
  scene.add(avatar.root);

  /* Layer stack ------------------------------------------------------ */
  const stack = new THREE.Group(); // positioned by layout
  const spin = new THREE.Group(); // user drag + pointer tilt
  const tilt = new THREE.Group(); // exploded ↔ flat rotation
  stack.add(spin);
  spin.add(tilt);
  scene.add(stack);

  const LW = 2.5;
  const LH = LW / LAYER_ASPECT;
  const layerGeo = new THREE.PlaneGeometry(LW, LH);
  const glassGeo = new RoundedBoxGeometry(LW, LH, 0.02, 3, 0.06);

  const layerObjs = layers.map((l, i) => {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(
      glassGeo,
      new THREE.MeshStandardMaterial({
        color: C.paperHi,
        transparent: true,
        opacity: i === 0 ? 0.92 : 0.38,
        roughness: 0.15,
        metalness: 0.0,
        depthWrite: false,
      })
    );
    glass.castShadow = i === 0;
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
    g.add(glass, art);
    g.renderOrder = i;
    glass.renderOrder = i * 2;
    art.renderOrder = i * 2 + 1;
    tilt.add(g);
    return { g, art, glass, lift: 0, intro: 0 };
  });
  const arts = layerObjs.map((o) => o.art);

  // The finished screen + bezel appear once the layers have collapsed.
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(LW + 0.16, LH + 0.16, 0.08, 3, 0.07),
    new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.35, transparent: true, opacity: 0 })
  );
  bezel.position.z = -0.06;
  bezel.castShadow = true;
  tilt.add(bezel);
  const finished = new THREE.Mesh(
    layerGeo,
    new THREE.MeshBasicMaterial({ map: makeScreenTexture(renderer), transparent: true, opacity: 0, toneMapped: false })
  );
  tilt.add(finished);

  /* Layout per aspect ratio ----------------------------------------- */
  function computeLayout(aspect) {
    if (aspect < 0.78) {
      // Phones: stack on top, avatar below it, both centred.
      return {
        cam: new THREE.Vector3(0, 2.4, 11.6),
        camNear: new THREE.Vector3(0, 2.0, 10.6),
        target: new THREE.Vector3(0, 0.45, 0),
        stack: new THREE.Vector3(0, 0.55, 0),
        stackScale: 0.68,
        avatar: new THREE.Vector3(0.25, -1.55, 0.6),
        avatarRot: -0.2,
        avatarScale: 0.78,
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
      };
    }
    // Wide screens: everything sits right of centre, text on the left.
    return {
      cam: new THREE.Vector3(-0.6, 3.0, 10.2),
      camNear: new THREE.Vector3(-0.2, 2.2, 9.1),
      target: new THREE.Vector3(-0.6, 0.65, 0),
      stack: new THREE.Vector3(0.75, 1.05, 0),
      stackScale: 1,
      avatar: new THREE.Vector3(2.85, -0.55, 0.7),
      avatarRot: -0.6,
      avatarScale: 0.9,
    };
  }
  layout = layout || computeLayout(camera.aspect);

  /* Interaction ------------------------------------------------------ */
  const el = renderer.domElement;
  let hovered = -1;
  let selected = -1;
  let avatarHover = false;
  let drag = null;
  let yaw = 0;
  let yawVel = 0;

  const pickLayer = (x, y) => {
    const hit = stage.pick(x, y, arts)[0];
    return hit ? hit.object.userData.index : -1;
  };
  const pickAvatar = (x, y) => stage.pick(x, y, avatar.hitTargets).length > 0;

  const onPointerMove = (e) => {
    if (drag) {
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.moved += Math.abs(dx);
      const v = (dx / Math.max(1, container.clientWidth)) * 5.5;
      yaw += v;
      yawVel = v / Math.max(0.008, (performance.now() - drag.t) / 1000);
      drag.t = performance.now();
      return;
    }
    if (e.pointerType === "touch") return;
    const i = pickLayer(e.clientX, e.clientY);
    const a = i < 0 && pickAvatar(e.clientX, e.clientY);
    if (i !== hovered) {
      hovered = i;
      onLayer?.(i >= 0 ? i : selected);
    }
    if (a !== avatarHover) {
      avatarHover = a;
      avatar.setHover(a);
    }
    el.style.cursor = a || i >= 0 ? "pointer" : "grab";
  };
  const onPointerDown = (e) => {
    drag = { x: e.clientX, t: performance.now(), moved: 0, start: e.clientX };
    yawVel = 0;
    el.style.cursor = "grabbing";
  };
  const onPointerUp = (e) => {
    if (!drag) return;
    const tapped = drag.moved < 6;
    drag = null;
    el.style.cursor = "grab";
    if (!tapped) return;
    if (pickAvatar(e.clientX, e.clientY)) {
      avatar.wave();
      onAvatarClick?.();
      return;
    }
    const i = pickLayer(e.clientX, e.clientY);
    selected = i === selected ? -1 : i;
    onLayer?.(selected);
  };
  const onLeave = () => {
    hovered = -1;
    avatarHover = false;
    avatar.setHover(false);
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
  let introT = reduced ? 10 : 0;
  let smoothP = 0;

  function frame(dt, t) {
    introT += dt;
    const L = layout;
    smoothP = reduced ? clamp(getProgress()) : damp(smoothP, clamp(getProgress()), 7, dt);
    const p = smoothstep(0.08, 0.85, smoothP);

    // Camera: dolly in as the layers collapse (the "zoom").
    camPos.lerpVectors(L.cam, L.camNear, p);
    camPos.x += pointer.sx * 0.25;
    camPos.y += pointer.sy * 0.12;
    camera.position.copy(camPos);
    camera.lookAt(L.target);

    // Avatar
    avatar.root.position.copy(L.avatar);
    avatar.root.rotation.y = L.avatarRot;
    avatar.root.scale.setScalar(L.avatarScale);
    // The avatar looks at the cursor, measured from its own position.
    avatar.update(dt, t, pointer, { reduced });

    // Stack placement
    stack.position.copy(L.stack);
    stack.scale.setScalar(L.stackScale * (1 + p * 0.08));

    // Drag inertia, then ease back towards the resting angle.
    if (!drag) {
      yaw += yawVel * dt;
      yawVel = damp(yawVel, 0, 3.5, dt);
      yaw = damp(yaw, 0, 0.6, dt);
    }
    spin.rotation.y = yaw + pointer.sx * 0.22 * (1 - p * 0.6) + (reduced ? 0 : Math.sin(t * 0.35) * 0.05 * (1 - p));
    spin.rotation.x = -pointer.sy * 0.12 * (1 - p * 0.5);

    // Exploded (isometric) → flat screen
    tilt.rotation.x = THREE.MathUtils.lerp(-0.95, -0.12, p);
    tilt.rotation.z = THREE.MathUtils.lerp(0.62, 0, p);
    tilt.rotation.y = THREE.MathUtils.lerp(0, -0.32, p);

    const gap = THREE.MathUtils.lerp(0.42, 0.004, p);
    const active = hovered >= 0 ? hovered : selected;
    layerObjs.forEach((o, i) => {
      // Intro: layers rise into place one after another.
      o.intro = reduced ? 1 : smoothstep(0, 1, (introT - 0.25 - i * 0.12) / 0.8);
      o.lift = damp(o.lift, i === active ? 1 : 0, 9, dt);
      const bob = reduced ? 0 : Math.sin(t * 1.2 + i * 0.9) * 0.025 * (1 - p);
      o.g.position.z = i * gap + o.lift * 0.22 * (1 - p) + bob - (1 - o.intro) * 2.2;
      o.g.position.x = o.lift * 0.08 * (1 - p);
      const vis = o.intro * (1 - smoothstep(0.82, 0.98, p) * 0.9);
      o.art.material.opacity = vis;
      o.glass.material.opacity = (i === 0 ? 0.92 : 0.38) * vis * (1 - p * 0.5);
    });
    const done = smoothstep(0.72, 0.96, p);
    finished.material.opacity = done;
    finished.position.z = layers.length * gap + 0.02;
    bezel.material.opacity = done;
    bezel.visible = done > 0.01;

    // Speech bubble follows the avatar's head on screen.
    if (bubbleEl) {
      tmp.copy(avatar.getHeadTop()).project(camera);
      const cw = container.clientWidth;
      const x = Math.min(cw - 130, Math.max(130, (tmp.x * 0.5 + 0.5) * cw));
      const y = (-tmp.y * 0.5 + 0.5) * container.clientHeight;
      bubbleEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  }

  return {
    highlight(i) {
      selected = i;
    },
    wave: () => {
      avatar.wave();
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
