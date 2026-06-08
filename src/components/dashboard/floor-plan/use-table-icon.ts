"use client";

import { useEffect, useState } from "react";
import type { DiningTableShape } from "@/lib/floor-plan/types";

const TABLE_ICON_SRC: Record<DiningTableShape, string> = {
  ROUND: "/icons/table-round.svg",
  SQUARE: "/icons/table-square.svg",
  RECT: "/icons/table-rect.svg",
};

const iconCache = new Map<string, HTMLImageElement>();

function loadTableIcon(src: string): Promise<HTMLImageElement> {
  const cached = iconCache.get(src);

  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = src;
    image.onload = () => {
      iconCache.set(src, image);
      resolve(image);
    };
    image.onerror = reject;
  });
}

export function useTableIcon(shape: DiningTableShape) {
  const [icon, setIcon] = useState<HTMLImageElement | null>(
    () => iconCache.get(TABLE_ICON_SRC[shape]) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    const src = TABLE_ICON_SRC[shape];

    void loadTableIcon(src)
      .then((image) => {
        if (!cancelled) {
          setIcon(image);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIcon(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shape]);

  return icon;
}

export function getTableIconAspect(shape: DiningTableShape) {
  if (shape === "RECT") {
    return 80 / 48;
  }

  return 1;
}
