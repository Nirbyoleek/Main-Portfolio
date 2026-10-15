// The realistic avatar: a rigged 3D model (see tools/rocketbox-to-glb.mjs)
// animated by the TalkingHead library, which adds natural idle motion,
// blinking, eye contact, facial moods, hand gestures and lip-sync on top of
// the model's skeleton and ARKit blend shapes.
//
// The model's .glb lives in /public and is configured in data/content.ts.
import { Vector3, type Object3D } from "three";
import { TalkingHead } from "@met4citizen/talkinghead";
import { LipsyncEn } from "@met4citizen/talkinghead/modules/lipsync-en.mjs";
import type { AvatarModel } from "../data/content";
import { C } from "./palette";

export interface ProAvatar {
  /** Wave hello with a smile. */
  wave: () => void;
  /** A thumbs-up, e.g. when the resume is downloaded. */
  thumbsUp: () => void;
  /**
   * Say a line: the mouth moves word by word (no sound) while `onWord`
   * receives the caption so far. Resolves when the line is finished.
   */
  say: (text: string, opts?: { gesture?: string; onWord?: (soFar: string) => void }) => Promise<void>;
  /** Look toward a point on the page (client pixels) for a while. */
  lookAtPoint: (x: number, y: number, ms?: number) => void;
  dispose: () => void;
}

export interface ProAvatarOptions {
  /** Where to place the speech bubble each frame (client pixels above the head). */
  bubbleEl?: HTMLElement | null;
  /** Called when the visitor clicks the avatar. */
  onClick?: () => void;
  reduced?: boolean;
}

/** Loads the model, then resolves once the avatar is on screen. */
export async function createProAvatar(
  container: HTMLElement,
  model: AvatarModel,
  { bubbleEl, onClick, reduced = false }: ProAvatarOptions = {}
): Promise<ProAvatar> {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const dpr = window.devicePixelRatio || 1;
  // Set once the model has loaded; the bubble follows this bone.
  let headBone: Object3D | null | undefined = null;
  const tmp = new Vector3();

  const head = new TalkingHead(container, {
    cameraView: model.view ?? "mid",
    ...model.camera,
    cameraRotateEnable: false,
    cameraPanEnable: false,
    cameraZoomEnable: false,
    // Keep the render cost sane on dense phone screens.
    modelPixelRatio: Math.min(dpr, coarse ? 1.5 : 2) / dpr,
    modelFPS: coarse ? 30 : 60,
    // Lighting tuned to the site: soft white fill, a cool cobalt rim.
    lightAmbientColor: 0xffffff,
    lightAmbientIntensity: 1.6,
    lightDirectColor: 0xfff6ee,
    lightDirectIntensity: 22,
    lightDirectPhi: 0.6,
    lightDirectTheta: 1.4,
    lightSpotColor: C.cobalt,
    lightSpotIntensity: 14,
    lightSpotPhi: 0.2,
    lightSpotTheta: 3.6,
    lightSpotDispersion: 1,
    avatarMood: "happy",
    avatarMute: true,
    avatarIdleEyeContact: 0.55,
    avatarIdleHeadMove: reduced ? 0.1 : 0.5,
    // No speech here, so skip loading lip-sync language modules.
    lipsyncModules: [],
    modelMovementFactor: reduced ? 0.2 : 1,
    update: () => placeBubble(),
  });

  await head.showAvatar({
    url: model.url,
    body: model.body,
    avatarMood: "happy",
    lipsyncLang: "en",
    retarget: model.retarget,
    baseline: model.baseline,
  });
  head.setView(model.view ?? "mid", model.camera);

  // Lip-sync rules for English, loaded statically (the library would
  // otherwise import them by a runtime path the bundler can't see).
  head.lipsync.en = new LipsyncEn();

  /* Speech bubble above the head ------------------------------------ */
  headBone = head.armature?.getObjectByName("Head");
  function placeBubble() {
    if (!bubbleEl || !headBone) return;
    const r = container.getBoundingClientRect();
    // Wide stages: the bubble sits beside the face; narrow: above the head.
    const side = r.width >= 480;
    headBone.getWorldPosition(tmp);
    if (side) {
      tmp.x -= 0.15;
      tmp.y += 0.05;
    } else {
      tmp.y += 0.26;
    }
    tmp.project(head.camera);
    const x = (tmp.x * 0.5 + 0.5) * r.width + r.left;
    const y = (-tmp.y * 0.5 + 0.5) * r.height + r.top;
    const cw = window.innerWidth;
    const px = side ? Math.max(320, x) : Math.min(cw - 150, Math.max(150, x));
    if (bubbleEl.dataset.side !== (side ? "left" : "top")) bubbleEl.dataset.side = side ? "left" : "top";
    bubbleEl.style.transform = `translate3d(${px.toFixed(1)}px, ${Math.max(90, y).toFixed(1)}px, 0)`;
  }

  /* Gaze follows the cursor ----------------------------------------- */
  let lastLook = 0;
  const onMove = (e: PointerEvent) => {
    if (reduced || e.pointerType === "touch") return;
    const now = performance.now();
    if (now - lastLook < 120) return;
    lastLook = now;
    head.lookAt(e.clientX, e.clientY, 900);
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const onTap = () => {
    onClick?.();
  };
  container.addEventListener("click", onTap);
  container.style.cursor = "pointer";

  /* Pause while off screen ------------------------------------------- */
  let running = true;
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !running) {
        head.start();
        running = true;
      } else if (!e.isIntersecting && running) {
        head.stop();
        running = false;
      }
    },
    { rootMargin: "80px" }
  );
  io.observe(container);
  const onVisibility = () => {
    if (document.hidden && running) {
      head.stop();
      running = false;
    } else if (!document.hidden && !running && container.getBoundingClientRect().bottom > 0) {
      head.start();
      running = true;
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  return {
    wave() {
      head.setMood("happy");
      head.playGesture("handup", 2.4, true);
      head.makeEyeContact(2600);
    },
    thumbsUp() {
      head.playGesture("thumbup", 2.2, true);
      head.makeEyeContact(2000);
    },
    say(text, { gesture, onWord } = {}) {
      head.stopSpeaking();
      clearTimeout(sayTimer);
      const words = text.split(/\s+/).filter(Boolean);
      const wtimes: number[] = [];
      const wdurations: number[] = [];
      // Roughly conversational pace: longer words take longer, commas and
      // full stops add a beat.
      let t = 0;
      for (const w of words) {
        const d = 110 + w.replace(/[^\w]/g, "").length * 52;
        wtimes.push(t);
        wdurations.push(d);
        t += d + (/[.!?]$/.test(w) ? 260 : /[,;:]$/.test(w) ? 140 : 55);
      }
      let soFar = "";
      head.setMood("happy");
      head.makeEyeContact(t + 600);
      if (gesture && !reduced) head.playGesture(gesture, Math.min(3.2, t / 1000), Math.random() < 0.5);
      head.speakAudio({ words, wtimes, wdurations }, { lipsyncLang: "en" }, (w) => {
        soFar += w;
        onWord?.(soFar.trim());
      });
      return new Promise((resolve) => {
        sayTimer = setTimeout(resolve, t + 400);
      });
    },
    lookAtPoint(x, y, ms = 1500) {
      head.lookAt(x, y, ms);
    },
    dispose() {
      window.removeEventListener("pointermove", onMove);
      container.removeEventListener("click", onTap);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(sayTimer);
      io.disconnect();
      try {
        head.stop();
        head.dispose();
      } catch {
        /* already gone */
      }
      container.replaceChildren();
    },
  };
}
