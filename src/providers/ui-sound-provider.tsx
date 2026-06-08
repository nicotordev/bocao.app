"use client";

import { useEffect, useRef } from "react";
import {
  UI_SOUND_EVENT,
  preloadUiSounds,
  playUiSound,
  type UiSound,
} from "@/lib/ui-sounds";

const typedSounds: readonly UiSound[] = [
  "type01",
  "type02",
  "type03",
  "type04",
  "type05",
];

function isHTMLElement(value: EventTarget | null): value is HTMLElement {
  return value instanceof HTMLElement;
}

function isDisabled(element: HTMLElement) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true" ||
    element.closest("[aria-disabled='true']") !== null
  );
}

function readSoundAttribute(element: HTMLElement): UiSound | null | undefined {
  const soundElement = element.closest<HTMLElement>("[data-sound]");
  const sound = soundElement?.dataset.sound;

  if (!soundElement || !sound) return undefined;
  if (sound === "none") return null;

  return sound as UiSound;
}

function isTextEntry(element: HTMLElement): element is HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) return false;

  return [
    "email",
    "number",
    "password",
    "search",
    "tel",
    "text",
    "url",
  ].includes(element.type);
}

function resolvePointerSound(target: HTMLElement): UiSound | null {
  const explicitSound = readSoundAttribute(target);
  if (explicitSound !== undefined) return explicitSound;

  const selectItem = target.closest("[data-slot='select-item']");
  if (selectItem) return isDisabled(selectItem as HTMLElement) ? "disabled" : "select";

  const control = target.closest<HTMLElement>(
    [
      "[data-slot='tabs-trigger']",
      "[data-slot='select-trigger']",
      "[data-slot='navigation-menu-trigger']",
      "[data-slot='navigation-menu-link']",
      "[role='menuitem']",
      "a[href]",
      "button",
      "[role='button']",
    ].join(","),
  );

  if (!control) return null;

  if (isDisabled(control)) {
    return "disabled";
  }

  if (
    control.matches(
      "[data-slot='tabs-trigger'], [data-slot='select-trigger'], [data-slot='navigation-menu-trigger'], [data-slot='navigation-menu-link'], [role='menuitem']",
    )
  ) {
    return "select";
  }

  return "button";
}

function resolveChangeSound(target: HTMLElement): UiSound | null {
  const explicitSound = readSoundAttribute(target);
  if (explicitSound !== undefined) return explicitSound;

  if (target instanceof HTMLInputElement) {
    if (target.type === "checkbox" || target.type === "radio") {
      return target.checked ? "toggleOn" : "toggleOff";
    }

    if (target.type === "date" || target.type === "time") {
      return "select";
    }
  }

  if (target instanceof HTMLSelectElement) {
    return "select";
  }

  return null;
}

function resolveToastSound(toast: HTMLElement): UiSound {
  const type = toast.dataset.type ?? toast.getAttribute("data-type");

  if (type === "success") return "celebration";
  if (type === "error" || type === "warning") return "caution";

  return "notification";
}

export function UiSoundProvider() {
  const lastTypedAt = useRef(0);
  const typeSoundIndex = useRef(0);

  useEffect(() => {
    preloadUiSounds();

    function handlePointerDown(event: PointerEvent) {
      if (!isHTMLElement(event.target)) return;

      const sound = resolvePointerSound(event.target);
      if (sound) playUiSound(sound);
    }

    function handleChange(event: Event) {
      if (!isHTMLElement(event.target)) return;

      const sound = resolveChangeSound(event.target);
      if (sound) playUiSound(sound);
    }

    function handleInput(event: Event) {
      if (!isHTMLElement(event.target) || !isTextEntry(event.target)) return;

      const now = performance.now();
      if (now - lastTypedAt.current < 70) return;

      lastTypedAt.current = now;
      const sound = typedSounds[typeSoundIndex.current % typedSounds.length];
      typeSoundIndex.current += 1;
      playUiSound(sound, 0.18);
    }

    function handleCustomSound(event: Event) {
      const customEvent = event as CustomEvent<{
        sound?: UiSound;
        volume?: number;
      }>;

      if (customEvent.detail?.sound) {
        playUiSound(customEvent.detail.sound, customEvent.detail.volume);
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          const toast =
            node.matches("[data-sonner-toast]") ?
              node :
              node.querySelector<HTMLElement>("[data-sonner-toast]");

          if (toast) {
            playUiSound(resolveToastSound(toast));
          }
        }
      }
    });

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("change", handleChange, true);
    document.addEventListener("input", handleInput, true);
    window.addEventListener(UI_SOUND_EVENT, handleCustomSound);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("input", handleInput, true);
      window.removeEventListener(UI_SOUND_EVENT, handleCustomSound);
      observer.disconnect();
    };
  }, []);

  return null;
}
