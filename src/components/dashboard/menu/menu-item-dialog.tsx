"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import type { MenuItemTag } from "@/lib/menu/tag-types";
import {
  menuCustomTagsToMap,
  type MenuCustomTagRecord,
} from "@/lib/menu/custom-tags.shared";
import { mergeMenuItemTagsWithCustomDefinitions } from "@/lib/menu/tag-utils";
import { defaultLocale } from "@/i18n/locales";
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
  const customTagsByKey = menuCustomTagsToMap(customTagDefinitions);
  const [form, setForm] = useState<MenuItemFormValues>(() => emptyForm(locale));
  const [activeTab, setActiveTab] = useState("general");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoLabels: ProductImagesFieldLabels = labels.photos;
  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadForm() {
      if (item) {
        const existingFlow =
          productFlowsByMenuItemId[item.id] ??
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
          categoryId: categories[0]?.id ?? "",
        });
      }

      setValidationError("");
      setActiveTab("general");
    }

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [
    categories,
    customTagsByKey,
    item,
    locale,
    open,
    productFlowsByMenuItemId,
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

  async function handleSubmit() {
    const defaultName = form.translations.name[defaultLocale]?.trim();

    if (!defaultName) {
      setValidationError(labels.validation.name);
      return;
    }

    if (!form.categoryId) {
      setValidationError(labels.validation.category);
      return;
    }

    const priceNum = Number.parseFloat(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setValidationError(labels.validation.price);
      return;
    }

    const priceCents = Math.round(priceNum * 100);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          activeTab === "flow"
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
            {isEditing
              ? labels.itemDialog.editDescription
              : labels.itemDialog.createDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {validationError ? (
            <div className="mb-5 rounded-2xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {validationError}
            </div>
          ) : null}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col gap-5"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="general" className="rounded-xl">
                {labels.itemDialog.name}
              </TabsTrigger>
              <TabsTrigger value="flow" className="rounded-xl">
                {flowLabels.builder.tab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-5">
              <LocalizedProductFields
                labels={{
                  languages: labels.itemDialog.tagsLanguages,
                  name: labels.itemDialog.name,
                  namePlaceholder: labels.itemDialog.namePlaceholder,
                  description: labels.itemDialog.description,
                  descriptionPlaceholder:
                    labels.itemDialog.descriptionPlaceholder,
                }}
                localeOptions={localeOptions}
                value={form.translations}
                onChange={(translations) =>
                  updateField("translations", translations)
                }
              />

              <div className="grid gap-5 sm:grid-cols-2">
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
                      onChange={(event) =>
                        updateField("price", event.target.value)
                      }
                      placeholder="0"
                    />
                  </InputGroup>
                </Field>

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
              </div>

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

              <div>
                <p className="mb-2 text-sm font-medium">{labels.item.photos}</p>
                <ProductImagesField
                  labels={photoLabels}
                  imageUrls={form.images}
                  onChange={(images) => updateField("images", images)}
                  onUpload={handleUpload}
                />
              </div>
            </TabsContent>

            <TabsContent value="flow" className="min-h-0 flex-1">
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
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {labels.actions.cancel}
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
