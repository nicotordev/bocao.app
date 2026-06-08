import type { Locale } from "@/i18n/locales";
import { defaultLocale, locales } from "@/i18n/locales";
import type { MenuItemFieldTranslations } from "@/lib/menu/item-translations";
import { buildMenuItemTranslationInputs } from "@/lib/menu/item-translations";
import { prisma } from "@/lib/prisma";
import {
  buildDbTranslationMap,
  DB_TRANSLATION_ENTITY,
  DB_TRANSLATION_FIELD,
  type DbTranslationEntityType,
  type DbTranslationField,
  type DbTranslationInput,
} from "@/lib/translations/types";

export async function listDbTranslations(
  restaurantId: string,
  entityType: DbTranslationEntityType,
  entityKeys?: string[],
) {
  const rows = await prisma.dbTranslation.findMany({
    where: {
      restaurantId,
      entityType,
      ...(entityKeys?.length ? { entityKey: { in: entityKeys } } : {}),
    },
    select: {
      entityKey: true,
      locale: true,
      field: true,
      value: true,
    },
  });

  return buildDbTranslationMap(rows);
}

export async function upsertDbTranslations(
  restaurantId: string,
  inputs: DbTranslationInput[],
) {
  if (inputs.length === 0) {
    return;
  }

  await prisma.$transaction(
    inputs.map((input) =>
      prisma.dbTranslation.upsert({
        where: {
          restaurantId_entityType_entityKey_locale_field: {
            restaurantId,
            entityType: input.entityType,
            entityKey: input.entityKey,
            locale: input.locale,
            field: input.field,
          },
        },
        create: {
          restaurantId,
          entityType: input.entityType,
          entityKey: input.entityKey,
          locale: input.locale,
          field: input.field,
          value: input.value.trim(),
        },
        update: {
          value: input.value.trim(),
        },
      }),
    ),
  );
}

export async function deleteDbTranslationsForEntity(
  restaurantId: string,
  entityType: DbTranslationEntityType,
  entityKey: string,
  options?: {
    locales?: Locale[];
    fields?: DbTranslationField[];
  },
) {
  await prisma.dbTranslation.deleteMany({
    where: {
      restaurantId,
      entityType,
      entityKey,
      ...(options?.locales?.length ? { locale: { in: options.locales } } : {}),
      ...(options?.fields?.length ? { field: { in: options.fields } } : {}),
    },
  });
}

export async function syncMenuCustomTagTranslations(
  restaurantId: string,
  entityKey: string,
  translations: Partial<Record<Locale, string>>,
) {
  const inputs = Object.entries(translations)
    .map(([locale, value]) => ({
      entityType: DB_TRANSLATION_ENTITY.MENU_CUSTOM_TAG,
      entityKey,
      locale: locale as Locale,
      field: DB_TRANSLATION_FIELD.LABEL,
      value: value?.trim() ?? "",
    }))
    .filter((entry) => entry.value.length > 0);

  if (inputs.length === 0) {
    await deleteDbTranslationsForEntity(
      restaurantId,
      DB_TRANSLATION_ENTITY.MENU_CUSTOM_TAG,
      entityKey,
    );
    return;
  }

  const enabledLocales = inputs.map((entry) => entry.locale);

  await prisma.dbTranslation.deleteMany({
    where: {
      restaurantId,
      entityType: DB_TRANSLATION_ENTITY.MENU_CUSTOM_TAG,
      entityKey,
      field: DB_TRANSLATION_FIELD.LABEL,
      locale: { notIn: enabledLocales },
    },
  });

  await upsertDbTranslations(restaurantId, inputs);
}

export async function syncMenuItemTranslations(
  restaurantId: string,
  menuItemId: string,
  translations: MenuItemFieldTranslations,
) {
  const inputs = buildMenuItemTranslationInputs(menuItemId, translations);
  const nonDefaultLocales = locales.filter((locale) => locale !== defaultLocale);

  if (inputs.length === 0) {
    await prisma.dbTranslation.deleteMany({
      where: {
        restaurantId,
        entityType: DB_TRANSLATION_ENTITY.MENU_ITEM,
        entityKey: menuItemId,
      },
    });
    return;
  }

  const enabledNameLocales = new Set(
    inputs
      .filter((entry) => entry.field === DB_TRANSLATION_FIELD.NAME)
      .map((entry) => entry.locale),
  );
  const enabledDescriptionLocales = new Set(
    inputs
      .filter((entry) => entry.field === DB_TRANSLATION_FIELD.DESCRIPTION)
      .map((entry) => entry.locale),
  );

  for (const locale of nonDefaultLocales) {
    if (!enabledNameLocales.has(locale)) {
      await deleteDbTranslationsForEntity(
        restaurantId,
        DB_TRANSLATION_ENTITY.MENU_ITEM,
        menuItemId,
        { locales: [locale], fields: [DB_TRANSLATION_FIELD.NAME] },
      );
    }

    if (!enabledDescriptionLocales.has(locale)) {
      await deleteDbTranslationsForEntity(
        restaurantId,
        DB_TRANSLATION_ENTITY.MENU_ITEM,
        menuItemId,
        { locales: [locale], fields: [DB_TRANSLATION_FIELD.DESCRIPTION] },
      );
    }
  }

  await upsertDbTranslations(restaurantId, inputs);
}
