"use client";

export const UI_SOUND_EVENT = "bocao:ui-sound";

export const UI_SOUNDS = {
  button: "/sounds/button.wav",
  caution: "/sounds/caution.wav",
  celebration: "/sounds/celebration.wav",
  disabled: "/sounds/disabled.wav",
  notification: "/sounds/notification.wav",
  progressLoop: "/sounds/progress_loop.wav",
  ringtoneLoop: "/sounds/ringtone_loop.wav",
  select: "/sounds/select.wav",
  swipe: "/sounds/swipe.wav",
  swipe01: "/sounds/swipe_01.wav",
  swipe02: "/sounds/swipe_02.wav",
  swipe03: "/sounds/swipe_03.wav",
  swipe04: "/sounds/swipe_04.wav",
  swipe05: "/sounds/swipe_05.wav",
  tap01: "/sounds/tap_01.wav",
  tap02: "/sounds/tap_02.wav",
  tap03: "/sounds/tap_03.wav",
  tap04: "/sounds/tap_04.wav",
  tap05: "/sounds/tap_05.wav",
  toggleOff: "/sounds/toggle_off.wav",
  toggleOn: "/sounds/toggle_on.wav",
  transitionDown: "/sounds/transition_down.wav",
  transitionUp: "/sounds/transition_up.wav",
  type01: "/sounds/type_01.wav",
  type02: "/sounds/type_02.wav",
  type03: "/sounds/type_03.wav",
  type04: "/sounds/type_04.wav",
  type05: "/sounds/type_05.wav",
} as const;

export type UiSound = keyof typeof UI_SOUNDS;

const SOUND_VOLUME = 0.35;
const audioCache = new Map<UiSound, HTMLAudioElement>();

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

export function preloadUiSounds() {
  if (!canUseAudio()) return;

  for (const [sound, src] of Object.entries(UI_SOUNDS) as Array<
    [UiSound, string]
  >) {
    if (audioCache.has(sound)) continue;

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = SOUND_VOLUME;
    audioCache.set(sound, audio);
  }
}

export function playUiSound(sound: UiSound, volume = SOUND_VOLUME) {
  if (!canUseAudio()) return;

  const cached = audioCache.get(sound);
  const audio = cached ?? new Audio(UI_SOUNDS[sound]);

  if (!cached) {
    audio.preload = "auto";
    audioCache.set(sound, audio);
  }

  const playable = audio.cloneNode(true) as HTMLAudioElement;
  playable.volume = volume;
  void playable.play().catch(() => undefined);
}

export function dispatchUiSound(sound: UiSound, volume?: number) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<{ sound: UiSound; volume?: number }>(UI_SOUND_EVENT, {
      detail: { sound, volume },
    }),
  );
}
