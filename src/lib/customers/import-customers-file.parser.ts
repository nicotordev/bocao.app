import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import type {
  CustomerColumnMapping,
  CustomerImportFilePreview,
  CustomerImportFilePreviewRow,
  ImportCustomerFileField,
  NormalizedCustomerImportRow,
  ParseCustomerImportFileResult,
} from "@/lib/customers/import-customers.types";
import { IMPORT_CUSTOMER_FILE_FIELDS } from "@/lib/customers/import-customers.types";

export const MAX_CUSTOMER_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const HEADER_ALIASES: Record<ImportCustomerFileField, string[]> = {
  name: ["name", "nombre", "customer", "cliente", "customer_name", "cliente_nombre"],
  email: ["email", "correo", "mail", "e_mail"],
  phone: ["phone", "telefono", "teléfono", "mobile", "celular"],
  documentId: [
    "documentid",
    "document_id",
    "document",
    "documento",
    "rut",
    "dni",
    "id",
  ],
  address: ["address", "direccion", "dirección"],
  notes: ["notes", "notas", "note", "nota", "comments", "comentarios"],
  avatar: ["avatar", "image", "imageurl", "image_url", "photo", "picture", "imagen"],
};

const rawRowSchema = z.object({
  name: z.string().trim().min(1),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (value) =>
        !value ||
        value.length === 0 ||
        z.string().email().safeParse(value).success,
      { message: "INVALID_EMAIL" },
    ),
  phone: z.string().trim().optional().nullable(),
  documentId: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  avatar: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (value) =>
        !value ||
        value.length === 0 ||
        z.string().url().safeParse(value).success,
      { message: "INVALID_AVATAR_URL" },
    ),
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

function suggestColumnMapping(headers: string[]): CustomerColumnMapping {
  const mapping: CustomerColumnMapping = {};
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const field of IMPORT_CUSTOMER_FILE_FIELDS) {
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
  mapping: CustomerColumnMapping,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const field of IMPORT_CUSTOMER_FILE_FIELDS) {
    const header = mapping[field];

    if (!header) {
      continue;
    }

    mapped[field] = raw[header];
  }

  return mapped;
}

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalizeMappedRow(mapped: Record<string, unknown>): {
  data?: NormalizedCustomerImportRow;
  errors: string[];
} {
  const parsed = rawRowSchema.safeParse({
    name: mapped.name ?? "",
    email: mapped.email ?? null,
    phone: mapped.phone ?? null,
    documentId: mapped.documentId ?? null,
    address: mapped.address ?? null,
    notes: mapped.notes ?? null,
    avatar: mapped.avatar ?? null,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    data: {
      name: parsed.data.name,
      email: normalizeOptionalString(parsed.data.email),
      phone: normalizeOptionalString(parsed.data.phone),
      documentId: normalizeOptionalString(parsed.data.documentId),
      address: normalizeOptionalString(parsed.data.address),
      notes: normalizeOptionalString(parsed.data.notes),
      avatar: normalizeOptionalString(parsed.data.avatar),
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
): Array<Record<string, unknown>> {
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
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
  mapping: CustomerColumnMapping,
): CustomerImportFilePreview {
  const headers = extractHeaders(rows);
  const previewRows: CustomerImportFilePreviewRow[] = rows.map((row, index) => {
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

export async function parseCustomerImportFile(
  file: File,
  columnMapping?: CustomerColumnMapping,
): Promise<ParseCustomerImportFileResult> {
  if (file.size > MAX_CUSTOMER_IMPORT_FILE_SIZE_BYTES) {
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
        : parseSpreadsheetBuffer(buffer);
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

export function getValidCustomerRowsFromPreview(
  preview: CustomerImportFilePreview,
): NormalizedCustomerImportRow[] {
  return preview.rows
    .filter((row) => row.errors.length === 0 && row.data)
    .map((row) => row.data as NormalizedCustomerImportRow);
}
