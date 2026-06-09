import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import type {
  ColumnMapping,
  ImportFileField,
  MenuImportFilePreview,
  MenuImportFilePreviewRow,
  NormalizedImportRow,
  ParseMenuImportFileResult,
} from "@/lib/menu/import-products.types";
import { IMPORT_FILE_FIELDS } from "@/lib/menu/import-products.types";

export const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const HEADER_ALIASES: Record<ImportFileField, string[]> = {
  categoryName: [
    "categoryname",
    "category",
    "category_name",
    "categoria",
    "categoría",
  ],
  productName: [
    "productname",
    "product",
    "product_name",
    "name",
    "nombre",
    "item",
    "itemname",
  ],
  description: ["description", "desc", "descripcion", "descripción"],
  price: ["price", "precio", "amount", "cost"],
  imageUrl: ["imageurl", "image", "image_url", "photo", "picture", "imagen"],
  isAvailable: [
    "isavailable",
    "available",
    "availability",
    "disponible",
    "is_available",
  ],
};

const rawRowSchema = z.object({
  categoryName: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  price: z.union([z.number(), z.string()]),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (value) =>
        !value ||
        value.length === 0 ||
        z.string().url().safeParse(value).success,
      { message: "INVALID_IMAGE_URL" },
    ),
  isAvailable: z.coerce.boolean().default(true),
});

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function detectFileKind(fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "json" || mimeType.includes("json")) {
    return "json" as const;
  }

  if (
    extension === "xlsx" ||
    extension === "xls" ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return "xlsx" as const;
  }

  if (
    extension === "csv" ||
    mimeType.includes("csv") ||
    mimeType.includes("text")
  ) {
    return "csv" as const;
  }

  return null;
}

export function normalizePriceToCents(value: number | string): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    if (Number.isInteger(value) && value >= 100) {
      return value;
    }

    return Math.round(value * 100);
  }

  const cleaned = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\s/g, "");

  if (!cleaned) {
    return null;
  }

  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    return parsed;
  }

  return Math.round(parsed * 100);
}

function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const field of IMPORT_FILE_FIELDS) {
    const aliases = HEADER_ALIASES[field];
    const match = normalizedHeaders.find((header) =>
      aliases.includes(header.normalized),
    );

    if (match) {
      mapping[field] = match.original;
    }
  }

  return mapping;
}

function mapRow(
  raw: Record<string, unknown>,
  mapping: ColumnMapping,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const field of IMPORT_FILE_FIELDS) {
    const header = mapping[field];

    if (!header) {
      continue;
    }

    mapped[field] = raw[header];
  }

  return mapped;
}

function normalizeMappedRow(mapped: Record<string, unknown>): {
  data?: NormalizedImportRow;
  errors: string[];
} {
  const parsed = rawRowSchema.safeParse({
    categoryName: mapped.categoryName ?? "",
    productName: mapped.productName ?? "",
    description: mapped.description ?? null,
    price: mapped.price ?? "",
    imageUrl: mapped.imageUrl ?? null,
    isAvailable: mapped.isAvailable ?? true,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const priceCents = normalizePriceToCents(parsed.data.price);

  if (priceCents === null) {
    return { errors: ["INVALID_PRICE"] };
  }

  const imageUrl =
    parsed.data.imageUrl && parsed.data.imageUrl.length > 0
      ? parsed.data.imageUrl
      : null;

  return {
    data: {
      categoryName: parsed.data.categoryName,
      productName: parsed.data.productName,
      description: parsed.data.description?.trim() || null,
      priceCents,
      imageUrl,
      isAvailable: parsed.data.isAvailable,
    },
    errors: [],
  };
}

function rowsFromWorkbook(
  workbook: XLSX.WorkBook,
): Array<Record<string, unknown>> {
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
}

function parseSpreadsheetBuffer(
  buffer: ArrayBuffer,
  kind: "csv" | "xlsx",
): Array<Record<string, unknown>> {
  const workbook =
    kind === "csv"
      ? XLSX.read(Buffer.from(buffer), { type: "buffer" })
      : XLSX.read(Buffer.from(buffer), { type: "buffer" });

  return rowsFromWorkbook(workbook);
}

function parseJsonBuffer(buffer: ArrayBuffer): Array<Record<string, unknown>> {
  const text = Buffer.from(buffer).toString("utf8");
  const parsed = JSON.parse(text) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("INVALID_JSON_FORMAT");
  }

  return parsed.filter(
    (row): row is Record<string, unknown> =>
      typeof row === "object" && row !== null && !Array.isArray(row),
  );
}

function extractHeaders(rows: Array<Record<string, unknown>>) {
  const headers = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headers.add(key);
    }
  }

  return Array.from(headers);
}

function buildPreview(
  rows: Array<Record<string, unknown>>,
  mapping: ColumnMapping,
): MenuImportFilePreview {
  const headers = extractHeaders(rows);
  const previewRows: MenuImportFilePreviewRow[] = rows.map((row, index) => {
    const mapped = mapRow(row, mapping);
    const normalized = normalizeMappedRow(mapped);

    return {
      rowNumber: index + 1,
      data: normalized.data,
      errors: normalized.errors,
    };
  });

  const validCount = previewRows.filter(
    (row) => row.errors.length === 0 && row.data,
  ).length;

  return {
    headers,
    suggestedMapping: mapping,
    rows: previewRows,
    validCount,
    invalidCount: previewRows.length - validCount,
  };
}

export async function parseMenuImportFile(
  file: File,
  columnMapping?: ColumnMapping,
): Promise<ParseMenuImportFileResult> {
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }

  const kind = detectFileKind(file.name, file.type);

  if (!kind) {
    return { ok: false, error: "INVALID_FILE_FORMAT" };
  }

  const buffer = await file.arrayBuffer();
  let rows: Array<Record<string, unknown>>;

  try {
    rows =
      kind === "json"
        ? parseJsonBuffer(buffer)
        : parseSpreadsheetBuffer(buffer, kind);
  } catch {
    return { ok: false, error: "INVALID_FILE_FORMAT" };
  }

  if (rows.length === 0) {
    return { ok: false, error: "EMPTY_FILE" };
  }

  const headers = extractHeaders(rows);
  const mapping = columnMapping ?? suggestColumnMapping(headers);
  const preview = buildPreview(rows, mapping);

  return { ok: true, preview };
}

export function getValidRowsFromPreview(
  preview: MenuImportFilePreview,
): NormalizedImportRow[] {
  return preview.rows
    .filter((row) => row.errors.length === 0 && row.data)
    .map((row) => row.data as NormalizedImportRow);
}
