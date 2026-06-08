import type { Locale } from "@/i18n/locales";
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
