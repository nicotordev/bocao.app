"use client";

import { Circle, Group, Image as KonvaImage, Text } from "react-konva";
import type { DiningTableShape } from "@/lib/floor-plan/types";
import { getTableIconAspect, useTableIcon } from "./use-table-icon";

type TableMarkerProps = {
  shape: DiningTableShape;
  width: number;
  height: number;
  fill: string;
  number: string;
};

export function TableMarker({
  shape,
  width,
  height,
  fill,
  number,
}: TableMarkerProps) {
  const icon = useTableIcon(shape);
  const size = Math.max(width, height);
  const aspect = getTableIconAspect(shape);
  const iconWidth = shape === "RECT" ? size * 1.15 : size;
  const iconHeight = shape === "RECT" ? size / aspect : size;

  return (
    <Group>
      <Circle
        x={0}
        y={0}
        radius={size / 2 + 4}
        fill={fill}
        opacity={0.95}
        shadowBlur={6}
        shadowColor="rgba(15, 23, 42, 0.25)"
        shadowOffsetY={2}
      />
      {icon ? (
        <KonvaImage
          image={icon}
          x={-iconWidth / 2}
          y={-iconHeight / 2}
          width={iconWidth}
          height={iconHeight}
          listening={false}
        />
      ) : null}
      <Text
        text={number}
        x={-size / 2}
        y={size / 2 - 6}
        width={size}
        align="center"
        fill="#ffffff"
        fontStyle="bold"
        fontSize={Math.max(11, size * 0.22)}
        listening={false}
      />
    </Group>
  );
}
