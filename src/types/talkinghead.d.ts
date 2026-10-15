// Minimal types for the parts of TalkingHead this site uses.
// Library: https://github.com/met4citizen/TalkingHead (MIT).
declare module "@met4citizen/talkinghead" {
  import type { Camera, Object3D, Scene, WebGLRenderer } from "three";

  export type TalkingHeadView = "full" | "mid" | "upper" | "head";

  export interface TalkingHeadViewOptions {
    cameraDistance?: number;
    cameraX?: number;
    cameraY?: number;
    cameraRotateX?: number;
    cameraRotateY?: number;
  }

  export interface TalkingHeadOptions extends TalkingHeadViewOptions {
    cameraView?: TalkingHeadView;
    cameraRotateEnable?: boolean;
    cameraPanEnable?: boolean;
    cameraZoomEnable?: boolean;
    modelPixelRatio?: number;
    modelFPS?: number;
    modelMovementFactor?: number;
    lightAmbientColor?: number | string;
    lightAmbientIntensity?: number;
    lightDirectColor?: number | string;
    lightDirectIntensity?: number;
    lightDirectPhi?: number;
    lightDirectTheta?: number;
    lightSpotColor?: number | string;
    lightSpotIntensity?: number;
    lightSpotPhi?: number;
    lightSpotTheta?: number;
    lightSpotDispersion?: number;
    avatarMood?: string;
    avatarMute?: boolean;
    avatarIdleEyeContact?: number;
    avatarIdleHeadMove?: number;
    lipsyncModules?: string[];
    lipsyncLang?: string;
    update?: ((dt: number) => void) | null;
  }

  export interface TalkingHeadAvatar {
    url: string;
    body?: "M" | "F";
    avatarMood?: string;
    lipsyncLang?: string;
    retarget?: Record<string, unknown>;
    baseline?: Record<string, number>;
  }

  export class TalkingHead {
    constructor(node: HTMLElement, opt?: TalkingHeadOptions);
    armature: Object3D | null;
    camera: Camera;
    scene: Scene;
    renderer: WebGLRenderer;
    showAvatar(avatar: TalkingHeadAvatar, onprogress?: ((e: ProgressEvent) => void) | null): Promise<void>;
    setView(view: TalkingHeadView, opt?: TalkingHeadViewOptions): void;
    setMood(mood: string): void;
    playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void;
    stopGesture(ms?: number): void;
    lookAt(x: number | null, y: number | null, t: number): void;
    lookAtCamera(t: number): void;
    makeEyeContact(t: number): void;
    setFixedValue(mt: string, val: number | null, ms?: number | null): void;
    /** Queue lip-synced speech. With no audio, the face animates silently. */
    speakAudio(
      r: { words?: string[]; wtimes?: number[]; wdurations?: number[]; audio?: unknown },
      opt?: { lipsyncLang?: string } | null,
      onsubtitles?: ((word: string) => void) | null
    ): void;
    stopSpeaking(): void;
    speakWithHands(delay?: number, prob?: number): void;
    lipsync: Record<string, unknown>;
    start(): void;
    stop(): void;
    dispose(): void;
  }
}

declare module "@met4citizen/talkinghead/modules/lipsync-en.mjs" {
  export class LipsyncEn {}
}
