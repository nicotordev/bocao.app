"use client";

import {
  FLOOR_PLAN_TABLE_PALETTE_ID,
  FloorPlanTablePalette,
  FloorPlanTablePaletteStatic,
} from "@/components/dashboard/floor-plan/floor-plan-table-palette";
import type { FloorPlanPageLabels } from "@/components/dashboard/floor-plan/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  FLOOR_PLAN_FLOOR_MAX,
  FLOOR_PLAN_FLOOR_MIN,
} from "@/lib/floor-plan/types";
import type {
  DiningTableRecord,
  DiningTableShape,
} from "@/lib/floor-plan/types";
import { cn } from "@/lib/utils";

type EditorDraft = {
  name: string;
  floor: number;
  surfaceAreaM2: number;
};

type FloorPlanBuilderPanelProps = {
  labels: FloorPlanPageLabels["builder"];
  managerLabels: FloorPlanPageLabels["manager"];
  draft: EditorDraft;
  builderTool: "boundary" | "tables";
  selectedTable: DiningTableRecord | null;
  isDndReady: boolean;
  canEdit: boolean;
  showActions?: boolean;
  isSaving?: boolean;
  canCancel?: boolean;
  onDraftChange: (patch: Partial<EditorDraft>) => void;
  onUpdateSelectedTable: (patch: Partial<DiningTableRecord>) => void;
  onRemoveSelectedTable: () => void;
  onBeforeTableChange?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
};

export function FloorPlanBuilderPanel({
  labels,
  managerLabels,
  draft,
  builderTool,
  selectedTable,
  isDndReady,
  canEdit,
  showActions = true,
  isSaving = false,
  canCancel = false,
  onDraftChange,
  onUpdateSelectedTable,
  onRemoveSelectedTable,
  onBeforeTableChange,
  onSave,
  onCancel,
}: FloorPlanBuilderPanelProps) {
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-none md:border md:shadow-xs">
        <CardHeader className="px-0 pt-0 md:px-6 md:pt-6">
          <CardTitle>{labels.surfaceName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0 md:px-6">
          <Field>
            <FieldLabel>{labels.surfaceName}</FieldLabel>
            <Input
              value={draft.name}
              onChange={(event) =>
                onDraftChange({ name: event.target.value })
              }
              placeholder={labels.surfaceNamePlaceholder}
            />
          </Field>
          <Field>
            <FieldLabel>{labels.floor}</FieldLabel>
            <Input
              type="number"
              min={FLOOR_PLAN_FLOOR_MIN}
              max={FLOOR_PLAN_FLOOR_MAX}
              value={draft.floor}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(next)) {
                  onDraftChange({ floor: next });
                }
              }}
              placeholder={labels.floorPlaceholder}
            />
            <p className="text-xs text-muted-foreground">{labels.floorHint}</p>
          </Field>
          <Field>
            <FieldLabel>{labels.surfaceAreaM2}</FieldLabel>
            <Input
              type="number"
              min={1}
              value={draft.surfaceAreaM2}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value);
                if (!Number.isNaN(next)) {
                  onDraftChange({ surfaceAreaM2: next });
                }
              }}
              placeholder={labels.surfaceAreaPlaceholder}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            {managerLabels.floor} {draft.floor} · {managerLabels.surfaceArea}{" "}
            {draft.surfaceAreaM2.toFixed(1)} m²
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none md:border md:shadow-xs">
        <CardHeader className="px-0 pt-0 md:px-6 md:pt-6">
          <CardTitle>{labels.toolTables}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0 md:px-6">
          <div
            className={cn(
              "rounded-3xl border border-dashed border-border bg-muted/20 p-4",
              builderTool !== "tables" && "opacity-60",
            )}
          >
            {isDndReady ? (
              <FloorPlanTablePalette
                label={labels.dragTableLabel}
                disabled={builderTool !== "tables"}
              />
            ) : (
              <FloorPlanTablePaletteStatic
                label={labels.dragTableLabel}
                disabled={builderTool !== "tables"}
              />
            )}
          </div>

          {selectedTable ? (
            <div className="space-y-3 rounded-3xl border border-border p-4">
              <Field>
                <FieldLabel>{labels.tableNumber}</FieldLabel>
                <Input
                  value={selectedTable.number}
                  onChange={(event) =>
                    onUpdateSelectedTable({ number: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>{labels.tableCapacity}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={selectedTable.capacity}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(next)) {
                      onUpdateSelectedTable({ capacity: next });
                    }
                  }}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ROUND", labels.tableShapeRound],
                    ["SQUARE", labels.tableShapeSquare],
                    ["RECT", labels.tableShapeRect],
                  ] as const
                ).map(([shape, label]) => (
                  <Button
                    key={shape}
                    type="button"
                    size="sm"
                    variant={
                      selectedTable.shape === shape ? "default" : "secondary"
                    }
                    onClick={() => {
                      onBeforeTableChange?.();
                      onUpdateSelectedTable({
                        shape: shape as DiningTableShape,
                        width: shape === "RECT" ? 0.12 : 0.08,
                        height: shape === "RECT" ? 0.07 : 0.08,
                      });
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={onRemoveSelectedTable}
              >
                {labels.removeTable}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {labels.selectedTableHint}
            </p>
          )}
        </CardContent>
      </Card>

      {showActions ? (
        <div className="flex flex-wrap gap-2">
          {onSave ? (
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? labels.saving : labels.save}
            </Button>
          ) : null}
          {canCancel && onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {labels.cancel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
