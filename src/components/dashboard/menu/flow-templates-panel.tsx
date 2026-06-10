"use client";

import {
  TbPencil,
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { useState } from "react";
import { toast } from "sonner";
import {
  createFlowTemplateAction,
  deleteFlowTemplateAction,
  updateFlowTemplateAction,
} from "@/app/actions/product-flow";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowLibraryScopeInput,
  FlowStep,
  ProductFlowTemplateRecord,
} from "@/lib/product-flow/types";
import type { ProductFlowLabels } from "./types";

type FlowTemplatesPanelProps = {
  labels: ProductFlowLabels;
  restaurantId: string;
  templates: ProductFlowTemplateRecord[];
  scope: FlowLibraryScopeInput | null;
  onTemplatesChange: (templates: ProductFlowTemplateRecord[]) => void;
  className?: string;
};

type TemplateEditorMode =
  | { kind: "none" }
  | {
      kind: "create";
      name: string;
      description: string;
      steps: FlowStep[];
    }
  | {
      kind: "edit";
      templateId: string;
      name: string;
      description: string;
      steps: FlowStep[];
    };

export function FlowTemplatesPanel({
  labels,
  restaurantId,
  templates,
  scope,
  onTemplatesChange,
  className,
}: FlowTemplatesPanelProps) {
  const [editor, setEditor] = useState<TemplateEditorMode>({ kind: "none" });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    if (editor.kind === "none" || !editor.name.trim()) {
      toast.error(labels.validation.blockLabel);
      return;
    }

    if (!scope) {
      toast.error(labels.library.scopeRequired);
      return;
    }

    setIsSaving(true);

    try {
      if (editor.kind === "create") {
        const result = await createFlowTemplateAction({
          restaurantId,
          ...scope,
          name: editor.name,
          description: editor.description || undefined,
          steps: editor.steps,
        });
        onTemplatesChange(
          [...templates, result.template].sort(
            (left, right) => left.sortOrder - right.sortOrder,
          ),
        );
        toast.success(labels.library.successCreateTemplate);
      } else {
        const result = await updateFlowTemplateAction({
          restaurantId,
          templateId: editor.templateId,
          ...scope,
          name: editor.name,
          description: editor.description || null,
          steps: editor.steps,
        });
        onTemplatesChange(
          templates.map((template) =>
            template.id === result.template.id ? result.template : template,
          ),
        );
        toast.success(labels.library.successUpdateTemplate);
      }

      setEditor({ kind: "none" });
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(templateId: string) {
    try {
      setIsDeleting(true);
      await deleteFlowTemplateAction({ restaurantId, templateId });
      onTemplatesChange(
        templates.filter((template) => template.id !== templateId),
      );
      toast.success(labels.library.successDeleteTemplate);

      if (editor.kind === "edit" && editor.templateId === templateId) {
        setEditor({ kind: "none" });
      }
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  return (
    <>
    <div
      className={`grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] ${className ?? "h-full"}`}
    >
      <aside className="min-h-0 overflow-y-auto border-b border-border bg-muted/20 p-4 lg:border-r lg:border-b-0">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">{labels.library.templates}</p>
          <Button
            type="button"
            size="sm"
            className="gap-2 rounded-2xl"
            onClick={() =>
              setEditor({
                kind: "create",
                name: "",
                description: "",
                steps: [],
              })
            }
          >
            <TbPlus className="size-4" aria-hidden />
            {labels.library.newTemplate}
          </Button>
        </div>

        <div className="space-y-2">
          {!scope ? (
            <p className="text-sm text-muted-foreground">
              {labels.library.scopeRequired}
            </p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {labels.library.emptyTemplates}
            </p>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() =>
                  setEditor({
                    kind: "edit",
                    templateId: template.id,
                    name: template.name,
                    description: template.description ?? "",
                    steps: template.steps,
                  })
                }
                className="flex w-full flex-col rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30"
              >
                <span className="text-sm font-medium">{template.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {labels.builder.stepCount.replace(
                    "{count}",
                    String(template.steps.length),
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="min-h-0 overflow-y-auto p-6">
        {editor.kind === "none" ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
            <p className="font-medium">{labels.library.selectOrCreate}</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {labels.library.selectOrCreateDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {editor.kind === "create"
                  ? labels.library.createTemplateTitle
                  : labels.library.editTemplateTitle}
              </p>
              {editor.kind === "edit" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPendingDeleteId(editor.templateId)}
                  aria-label={labels.library.deleteTemplate}
                >
                  <TbTrash className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>

            <Field>
              <FieldLabel>{labels.library.templateName}</FieldLabel>
              <Input
                value={editor.name}
                onChange={(event) =>
                  setEditor((current) =>
                    current.kind === "none"
                      ? current
                      : { ...current, name: event.target.value },
                  )
                }
                className="rounded-2xl"
              />
            </Field>

            <Field>
              <FieldLabel>{labels.library.templateDescription}</FieldLabel>
              <Textarea
                value={editor.description}
                onChange={(event) =>
                  setEditor((current) =>
                    current.kind === "none"
                      ? current
                      : { ...current, description: event.target.value },
                  )
                }
                className="rounded-2xl"
              />
            </Field>

            <p className="text-sm text-muted-foreground">
              {labels.builder.stepCount.replace(
                "{count}",
                String(editor.steps.length),
              )}
            </p>

            <Button
              type="button"
              className="gap-2 rounded-2xl"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              <TbPencil className="size-4" aria-hidden />
              {isSaving ? labels.actions.saving : labels.actions.save}
            </Button>
          </div>
        )}
      </div>
    </div>

    <ConfirmDialog
      open={pendingDeleteId !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setPendingDeleteId(null);
        }
      }}
      title={labels.library.deleteTemplate}
      description={labels.library.confirmDeleteTemplate}
      confirmLabel={labels.library.deleteTemplate}
      cancelLabel={labels.actions.cancel}
      onConfirm={() => {
        if (pendingDeleteId) {
          void handleDelete(pendingDeleteId);
        }
      }}
      isPending={isDeleting}
    />
    </>
  );
}
