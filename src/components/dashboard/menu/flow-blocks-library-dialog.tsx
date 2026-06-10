"use client";

import {
  TbPencil,
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createFlowBlockAction,
  deleteFlowBlockAction,
  updateFlowBlockAction,
} from "@/app/actions/product-flow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  createEmptyFlowBlockConfig,
  FlowBlockEditor,
} from "./flow-block-editor";
import {
  flowLibraryScopeMatches,
  resolveLocalizedLabel,
  slugifyFlowKey,
} from "@/lib/product-flow/engine";
import type {
  FlowBlockConfig,
  FlowBlockType,
  FlowLibraryScope,
  ProductFlowBlockRecord,
} from "@/lib/product-flow/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowTemplatesPanel } from "./flow-templates-panel";
import {
  FlowLibraryScopeField,
  flowLibraryScopeInputFromState,
} from "./flow-library-scope-field";
import type { MenuLocaleOption, ProductFlowLabels } from "./types";
import type { ProductFlowTemplateRecord } from "@/lib/product-flow/types";

type FlowBlocksLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: ProductFlowLabels;
  localeOptions: MenuLocaleOption[];
  currency: string;
  restaurantId: string;
  blocks: ProductFlowBlockRecord[];
  templates: ProductFlowTemplateRecord[];
  categories: Array<{ id: string; name: string }>;
  menuItems: Array<{ id: string; name: string }>;
  onBlocksChange: (blocks: ProductFlowBlockRecord[]) => void;
  onTemplatesChange: (templates: ProductFlowTemplateRecord[]) => void;
};

type EditorMode =
  | { kind: "none" }
  | {
      kind: "create";
      key: string;
      type: FlowBlockType;
      config: FlowBlockConfig;
    }
  | {
      kind: "edit";
      blockId: string;
      key: string;
      type: FlowBlockType;
      config: FlowBlockConfig;
    };

export function FlowBlocksLibraryDialog({
  open,
  onOpenChange,
  labels,
  localeOptions,
  currency,
  restaurantId,
  blocks,
  templates,
  categories,
  menuItems,
  onBlocksChange,
  onTemplatesChange,
}: FlowBlocksLibraryDialogProps) {
  const [editor, setEditor] = useState<EditorMode>({ kind: "none" });
  const [isSaving, setIsSaving] = useState(false);
  const [scopeType, setScopeType] = useState<FlowLibraryScope>("category");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [menuItemId, setMenuItemId] = useState(menuItems[0]?.id ?? "");
  const locale = localeOptions[0]?.value ?? "es";

  const activeScope = useMemo(
    () => flowLibraryScopeInputFromState(scopeType, categoryId, menuItemId),
    [scopeType, categoryId, menuItemId],
  );

  const scopedBlocks = useMemo(
    () =>
      activeScope
        ? blocks.filter((block) => flowLibraryScopeMatches(block, activeScope))
        : [],
    [activeScope, blocks],
  );

  const scopedTemplates = useMemo(
    () =>
      activeScope
        ? templates.filter((template) =>
            flowLibraryScopeMatches(template, activeScope),
          )
        : [],
    [activeScope, templates],
  );

  function startCreate() {
    setEditor({
      kind: "create",
      key: "",
      type: "choice",
      config: {
        ...createEmptyFlowBlockConfig(),
        options: [],
      },
    });
  }

  function startEdit(block: ProductFlowBlockRecord) {
    setEditor({
      kind: "edit",
      blockId: block.id,
      key: block.key,
      type: block.type,
      config: block.config,
    });
  }

  async function handleSave() {
    if (editor.kind === "none") {
      return;
    }

    const label = resolveLocalizedLabel(editor.config.label, locale);

    if (!label) {
      toast.error(labels.validation.blockLabel);
      return;
    }

    const scope = flowLibraryScopeInputFromState(
      scopeType,
      categoryId,
      menuItemId,
    );

    if (!scope) {
      toast.error(labels.library.scopeRequired);
      return;
    }

    const key = editor.key.trim() || slugifyFlowKey(label);

    setIsSaving(true);

    try {
      if (editor.kind === "create") {
        const result = await createFlowBlockAction({
          restaurantId,
          ...scope,
          key,
          type: editor.type,
          config: editor.config,
        });
        onBlocksChange(
          [...blocks, result.block].sort(
            (left, right) => left.sortOrder - right.sortOrder,
          ),
        );
        toast.success(labels.library.successCreate);
      } else {
        const result = await updateFlowBlockAction({
          restaurantId,
          blockId: editor.blockId,
          ...scope,
          key,
          type: editor.type,
          config: editor.config,
        });
        onBlocksChange(
          blocks.map((block) =>
            block.id === result.block.id ? result.block : block,
          ),
        );
        toast.success(labels.library.successUpdate);
      }

      setEditor({ kind: "none" });
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(blockId: string) {
    if (!window.confirm(labels.library.confirmDelete)) {
      return;
    }

    try {
      await deleteFlowBlockAction({ restaurantId, blockId });
      onBlocksChange(blocks.filter((block) => block.id !== blockId));
      toast.success(labels.library.successDelete);
    } catch {
      toast.error(labels.feedback.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(94vh,980px)] w-[min(98vw,88rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,88rem)]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{labels.library.title}</DialogTitle>
          <DialogDescription>{labels.library.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="blocks" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-4 border-b border-border px-6 py-4">
            <FlowLibraryScopeField
              labels={labels}
              scopeType={scopeType}
              categoryId={categoryId}
              menuItemId={menuItemId}
              categories={categories}
              menuItems={menuItems}
              onScopeTypeChange={setScopeType}
              onCategoryIdChange={setCategoryId}
              onMenuItemIdChange={setMenuItemId}
            />
            <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl">
              <TabsTrigger value="blocks" className="rounded-xl">
                {labels.library.blocks}
              </TabsTrigger>
              <TabsTrigger value="templates" className="rounded-xl">
                {labels.library.templates}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="blocks"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-b border-border bg-muted/20 p-4 lg:border-r lg:border-b-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">{labels.library.blocks}</p>
              <Button
                type="button"
                size="sm"
                className="gap-2 rounded-2xl"
                onClick={startCreate}
              >
                <TbPlus className="size-4" aria-hidden />
                {labels.library.newBlock}
              </Button>
            </div>

            <div className="space-y-2">
              {!activeScope ? (
                <p className="text-sm text-muted-foreground">
                  {labels.library.scopeRequired}
                </p>
              ) : scopedBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {labels.library.empty}
                </p>
              ) : (
                scopedBlocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => {
                      setScopeType(block.scopeType);
                      if (block.categoryId) {
                        setCategoryId(block.categoryId);
                      }
                      if (block.menuItemId) {
                        setMenuItemId(block.menuItemId);
                      }
                      startEdit(block);
                    }}
                    className="flex w-full items-start justify-between gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {resolveLocalizedLabel(block.config.label, locale)}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {block.key}
                      </span>
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {labels.blockTypes[block.type]}
                    </Badge>
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
                      ? labels.library.createTitle
                      : labels.library.editTitle}
                  </p>
                  {editor.kind === "edit" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleDelete(editor.blockId)}
                      aria-label={labels.library.deleteBlock}
                    >
                      <TbTrash className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>

                <FlowBlockEditor
                  labels={labels}
                  localeOptions={localeOptions}
                  currency={currency}
                  blockKey={editor.key}
                  blockType={editor.type}
                  config={editor.config}
                  menuItems={menuItems}
                  onBlockKeyChange={(key) =>
                    setEditor((current) =>
                      current.kind === "none"
                        ? current
                        : { ...current, key },
                    )
                  }
                  onBlockTypeChange={(type) =>
                    setEditor((current) =>
                      current.kind === "none"
                        ? current
                        : { ...current, type, config: createEmptyFlowBlockConfig() },
                    )
                  }
                  onConfigChange={(config) =>
                    setEditor((current) =>
                      current.kind === "none"
                        ? current
                        : { ...current, config },
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
          </TabsContent>

          <TabsContent
            value="templates"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <FlowTemplatesPanel
              className="min-h-0 flex-1"
              labels={labels}
              restaurantId={restaurantId}
              templates={scopedTemplates}
              scope={activeScope}
              onTemplatesChange={(nextTemplates) => {
                if (!activeScope) {
                  return;
                }

                const otherTemplates = templates.filter(
                  (template) =>
                    !flowLibraryScopeMatches(template, activeScope),
                );
                onTemplatesChange([...otherTemplates, ...nextTemplates]);
              }}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            {labels.actions.close}
          </Button>
          {editor.kind !== "none" ? (
            <Button
              type="button"
              className="gap-2 rounded-2xl"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              <TbPencil className="size-4" aria-hidden />
              {isSaving ? labels.actions.saving : labels.actions.save}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
