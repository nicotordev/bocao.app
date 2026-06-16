"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createMenuItemAction,
  updateMenuItemAction,
  uploadMenuItemImageAction,
} from "@/app/actions/menu";
import {
  deleteProductFlowAction,
  getProductPurchaseFlowAction,
  upsertProductFlowAction,
} from "@/app/actions/product-flow";
import {
  ProductImagesField,
  type ProductImagesFieldLabels,
} from "@/components/dashboard/product-images-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import type { MenuItemTag } from "@/lib/menu/tag-types";
import {
  menuCustomTagsToMap,
  type MenuCustomTagRecord,
} from "@/lib/menu/custom-tags.shared";
import { mergeMenuItemTagsWithCustomDefinitions } from "@/lib/menu/tag-utils";
import { defaultLocale } from "@/i18n/locales";
import { cn } from "@/lib/utils";
import {
  buildProductTranslationDraft,
  createEmptyProductTranslations,
  LocalizedProductFields,
} from "./localized-product-fields";
import {
  MenuItemTagsField,
  type MenuCatalogTagOption,
} from "./menu-item-tags-field";
import type {
  MenuItemFormValues,
  MenuLocaleOption,
  MenuPageLabels,
  ProductFlowLabels,
} from "./types";
import { ProductFlowBuilder } from "./product-flow-builder";
import {
  filterFlowBlocksForMenuItem,
  filterFlowTemplatesForMenuItem,
} from "@/lib/product-flow/engine";
import type {
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
  ProductPurchaseFlowRecord,
} from "@/lib/product-flow/types";

const WIZARD_STEPS = [
  "identity",
  "placement",
  "photos",
  "tags",
  "flow",
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number];

const OPTIONAL_WIZARD_STEPS = new Set<WizardStepId>(["tags", "flow"]);

type MenuItemDialogProps = {
  labels: MenuPageLabels;
  currency: string;
  restaurantId: string;
  categories: MenuCategoryRecord[];
  item: MenuItemRecord | null;
  catalogTags: MenuCatalogTagOption[];
  tagCatalogLabels: Record<string, string>;
  customTagDefinitions: MenuCustomTagRecord[];
  localeOptions: MenuLocaleOption[];
  flowLabels: ProductFlowLabels;
  flowBlocks: ProductFlowBlockRecord[];
  flowTemplates: ProductFlowTemplateRecord[];
  productFlowsByMenuItemId: Record<string, ProductPurchaseFlowRecord>;
  allMenuItems: Array<{ id: string; name: string; priceCents: number }>;
  tagSuggestions: MenuItemTag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (
    item: MenuItemRecord,
    customTagDefinitions?: MenuCustomTagRecord[],
  ) => void;
  onFlowTemplateCreated?: (template: ProductFlowTemplateRecord) => void;
  onFlowSaved?: (
    menuItemId: string,
    flow: ProductPurchaseFlowRecord | null,
  ) => void;
};

const emptyForm = (locale: typeof defaultLocale): MenuItemFormValues => ({
  categoryId: "",
  translations: createEmptyProductTranslations(locale),
  price: "",
  isAvailable: true,
  images: [],
  tags: [],
  purchaseFlow: {
    isActive: false,
    steps: [],
  },
});

function getStepTitle(labels: MenuPageLabels, stepId: WizardStepId): string {
  return labels.itemDialog.wizard.steps[stepId];
}

function getStepDescription(
  labels: MenuPageLabels,
  stepId: WizardStepId,
): string {
  return labels.itemDialog.wizard.stepDescriptions[stepId];
}

export function MenuItemDialog({
  labels,
  currency,
  restaurantId,
  categories,
  item,
  catalogTags,
  tagCatalogLabels,
  customTagDefinitions,
  localeOptions,
  flowLabels,
  flowBlocks,
  flowTemplates,
  productFlowsByMenuItemId,
  allMenuItems,
  tagSuggestions,
  open,
  onOpenChange,
  onSuccess,
  onFlowTemplateCreated,
  onFlowSaved,
}: MenuItemDialogProps) {
  const locale = useLocale() as typeof defaultLocale;
  const customTagsByKey = useMemo(
    () => menuCustomTagsToMap(customTagDefinitions),
    [customTagDefinitions],
  );
  const defaultCategoryId = categories[0]?.id ?? "";
  const cachedFlow = item ? productFlowsByMenuItemId[item.id] : undefined;
  const [form, setForm] = useState<MenuItemFormValues>(() => emptyForm(locale));
  const [stepIndex, setStepIndex] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoLabels: ProductImagesFieldLabels = labels.photos;
  const isEditing = Boolean(item);
  const currentStep = WIZARD_STEPS[stepIndex] ?? WIZARD_STEPS[0];
  const isLastStep = stepIndex >= WIZARD_STEPS.length - 1;
  const isFlowStep = currentStep === "flow";

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadForm() {
      if (item) {
        const existingFlow =
          cachedFlow ??
          (await getProductPurchaseFlowAction({
            restaurantId,
            menuItemId: item.id,
          })
            .then((result) => result.flow)
            .catch(() => null));

        if (cancelled) {
          return;
        }

        setForm({
          categoryId: item.categoryId,
          translations: buildProductTranslationDraft(item.translations, locale),
          price: String(item.priceCents / 100),
          isAvailable: item.isAvailable,
          images: item.images,
          tags: mergeMenuItemTagsWithCustomDefinitions(
            item.tags,
            customTagsByKey,
          ),
          purchaseFlow: existingFlow
            ? {
                isActive: existingFlow.isActive,
                steps: existingFlow.steps,
              }
            : {
                isActive: false,
                steps: [],
              },
        });
      } else {
        setForm({
          ...emptyForm(locale),
          categoryId: defaultCategoryId,
        });
      }

      setValidationError("");
      setStepIndex(0);
    }

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [
    cachedFlow,
    customTagsByKey,
    defaultCategoryId,
    item,
    locale,
    open,
    restaurantId,
  ]);

  function updateField<K extends keyof MenuItemFormValues>(
    field: K,
    value: MenuItemFormValues[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError("");
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    formData.append("file", file);

    const result = await uploadMenuItemImageAction(formData);
    return result.url;
  }

  function validateStep(stepId: WizardStepId): string | null {
    if (stepId === "identity") {
      const defaultName = form.translations.name[defaultLocale]?.trim();
      if (!defaultName) {
        return labels.validation.name;
      }
    }

    if (stepId === "placement") {
      if (!form.categoryId) {
        return labels.validation.category;
      }

      const priceNum = Number.parseFloat(form.price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return labels.validation.price;
      }
    }

    return null;
  }

  function goToNextStep() {
    const error = validateStep(currentStep);

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    setStepIndex((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
  }

  function goToPreviousStep() {
    setValidationError("");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function skipCurrentStep() {
    setValidationError("");
    setStepIndex((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
  }

  async function handleSubmit() {
    for (const stepId of ["identity", "placement"] as const) {
      const error = validateStep(stepId);
      if (error) {
        setValidationError(error);
        setStepIndex(WIZARD_STEPS.indexOf(stepId));
        return;
      }
    }

    const priceCents = Math.round(Number.parseFloat(form.price) * 100);
    setIsSubmitting(true);

    try {
      let savedItem = item;

      if (item) {
        const result = await updateMenuItemAction({
          restaurantId,
          menuItemId: item.id,
          categoryId: form.categoryId,
          priceCents,
          isAvailable: form.isAvailable,
          images: form.images,
          tags: form.tags,
          translations: form.translations,
        });
        savedItem = result.item;
        toast.success(labels.itemDialog.successUpdate);
        onSuccess(result.item, result.customTagDefinitions);
      } else {
        const result = await createMenuItemAction({
          restaurantId,
          categoryId: form.categoryId,
          priceCents,
          isAvailable: form.isAvailable,
          images: form.images,
          tags: form.tags,
          translations: form.translations,
        });
        savedItem = result.item;
        toast.success(labels.itemDialog.successCreate);
        onSuccess(result.item, result.customTagDefinitions);
      }

      if (savedItem) {
        const shouldSaveFlow =
          form.purchaseFlow.isActive && form.purchaseFlow.steps.length > 0;
        const hadExistingFlow = Boolean(
          item?.id && productFlowsByMenuItemId[item.id],
        );

        if (shouldSaveFlow) {
          const flowResult = await upsertProductFlowAction({
            restaurantId,
            menuItemId: savedItem.id,
            isActive: true,
            steps: form.purchaseFlow.steps,
          });
          onFlowSaved?.(savedItem.id, flowResult.flow);
        } else if (hadExistingFlow) {
          await deleteProductFlowAction({
            restaurantId,
            menuItemId: savedItem.id,
          });
          onFlowSaved?.(savedItem.id, null);
        }
      }

      onOpenChange(false);
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case "identity":
        return (
          <LocalizedProductFields
            labels={{
              languages: labels.itemDialog.tagsLanguages,
              name: labels.itemDialog.name,
              namePlaceholder: labels.itemDialog.namePlaceholder,
              description: labels.itemDialog.description,
              descriptionPlaceholder: labels.itemDialog.descriptionPlaceholder,
              languagePlaceholder: labels.itemDialog.tagsLanguages,
              customLanguage: labels.itemDialog.tagsCustom,
            }}
            localeOptions={localeOptions}
            value={form.translations}
            onChange={(translations) =>
              updateField("translations", translations)
            }
          />
        );

      case "placement":
        return (
          <div className="space-y-5">
            <Field>
              <FieldLabel className="required">
                {labels.itemDialog.category}
              </FieldLabel>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(value) => updateField("categoryId", value)}
              >
                <SelectTrigger className="rounded-3xl">
                  <SelectValue
                    placeholder={labels.itemDialog.categoryPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className="rounded-lg"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel className="required">
                {labels.itemDialog.price}
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>{currency}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="0"
                />
              </InputGroup>
            </Field>

            <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2">
              <Switch
                id="menu-item-available"
                checked={form.isAvailable}
                onCheckedChange={(checked) =>
                  updateField("isAvailable", checked)
                }
              />
              <FieldLabel
                htmlFor="menu-item-available"
                className="cursor-pointer"
              >
                {labels.itemDialog.available}
              </FieldLabel>
            </div>
          </div>
        );

      case "photos":
        return (
          <ProductImagesField
            labels={photoLabels}
            imageUrls={form.images}
            onChange={(images) => updateField("images", images)}
            onUpload={handleUpload}
            variant="gallery"
          />
        );

      case "tags":
        return (
          <MenuItemTagsField
            labels={{
              label: labels.itemDialog.tags,
              catalog: labels.itemDialog.tagsCatalog,
              customLabel: labels.itemDialog.tagsCustom,
              customPlaceholder: labels.itemDialog.tagsPlaceholder,
              add: labels.itemDialog.tagsAdd,
              remove: labels.itemDialog.tagsRemove,
              suggestions: labels.itemDialog.tagsSuggestions,
              pickIcon: labels.itemDialog.tagsPickIcon,
              languages: labels.itemDialog.tagsLanguages,
            }}
            localeOptions={localeOptions}
            catalogTags={catalogTags}
            catalogLabels={tagCatalogLabels}
            customTagDefinitions={customTagDefinitions}
            value={form.tags}
            suggestions={tagSuggestions}
            onChange={(tags) => updateField("tags", tags)}
          />
        );

      case "flow":
        return (
          <ProductFlowBuilder
            labels={flowLabels}
            localeOptions={localeOptions}
            currency={currency}
            menuItemId={item?.id}
            categoryId={form.categoryId}
            menuItemName={
              form.translations.name[defaultLocale]?.trim() ||
              item?.name ||
              labels.itemDialog.name
            }
            basePriceCents={Math.round(
              (Number.parseFloat(form.price) || 0) * 100,
            )}
            blocks={filterFlowBlocksForMenuItem(
              flowBlocks,
              item?.id,
              form.categoryId,
            )}
            templates={filterFlowTemplatesForMenuItem(
              flowTemplates,
              item?.id,
              form.categoryId,
            )}
            menuItems={allMenuItems}
            restaurantId={restaurantId}
            value={form.purchaseFlow}
            onChange={(purchaseFlow) =>
              updateField("purchaseFlow", purchaseFlow)
            }
            onTemplateCreated={onFlowTemplateCreated}
          />
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          isFlowStep
            ? "flex h-[min(94vh,980px)] w-[min(98vw,88rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,88rem)]"
            : "flex h-[min(90vh,820px)] w-[min(96vw,42rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,42rem)]"
        }
      >
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>
            {isEditing
              ? labels.itemDialog.editTitle
              : labels.itemDialog.createTitle}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription(labels, currentStep)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 border-b border-border px-6 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {WIZARD_STEPS.map((stepId, index) => (
              <div
                key={stepId}
                className={cn(
                  "rounded-2xl border px-2 py-2 text-center text-xs font-medium transition-colors",
                  index === stepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < stepIndex
                      ? "border-border bg-muted/40 text-foreground"
                      : "border-border bg-background text-muted-foreground",
                )}
              >
                {getStepTitle(labels, stepId)}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {labels.itemDialog.wizard.stepProgress
              .replace("{current}", String(stepIndex + 1))
              .replace("{total}", String(WIZARD_STEPS.length))}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {validationError ? (
            <div className="mb-5 rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {validationError}
            </div>
          ) : null}

          <div className="space-y-1">
            <h3 className="font-heading text-base font-medium tracking-tight">
              {getStepTitle(labels, currentStep)}
            </h3>
          </div>

          <div className={cn("mt-5", isFlowStep && "min-h-0")}>
            {renderStepContent()}
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {labels.actions.cancel}
          </Button>

          <div className="flex flex-wrap justify-end gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
              >
                {labels.flow.wizard.back}
              </Button>
            ) : null}

            {OPTIONAL_WIZARD_STEPS.has(currentStep) && !isLastStep ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={skipCurrentStep}
                disabled={isSubmitting}
              >
                {labels.itemDialog.wizard.skip}
              </Button>
            ) : null}

            {isLastStep ? (
              <Button
                type="button"
                className="rounded-2xl"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || categories.length === 0}
              >
                {isSubmitting
                  ? labels.actions.saving
                  : isEditing
                    ? labels.actions.save
                    : labels.actions.create}
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-2xl"
                onClick={goToNextStep}
                disabled={isSubmitting}
              >
                {labels.flow.wizard.next}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
