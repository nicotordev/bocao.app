export type ImportableMenuProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type ImportableMenuCategory = {
  id: string;
  name: string;
  description: null;
  sourceRestaurantId: string;
  sourceRestaurantName: string;
  sourceOrganizationId: string;
  sourceOrganizationName: string;
  products: ImportableMenuProduct[];
};

export type ImportableMenuResponse = {
  categories: ImportableMenuCategory[];
};

export type ImportProductsResult =
  | {
      ok: true;
      importedCategories: number;
      importedProducts: number;
    }
  | {
      ok: false;
      error: string;
    };

export const IMPORT_FILE_FIELDS = [
  "categoryName",
  "productName",
  "description",
  "price",
  "imageUrl",
  "isAvailable",
] as const;

export type ImportFileField = (typeof IMPORT_FILE_FIELDS)[number];

export type ColumnMapping = Partial<Record<ImportFileField, string>>;

export type NormalizedImportRow = {
  categoryName: string;
  productName: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type MenuImportFilePreviewRow = {
  rowNumber: number;
  data?: NormalizedImportRow;
  errors: string[];
};

export type MenuImportFilePreview = {
  headers: string[];
  suggestedMapping: ColumnMapping;
  rows: MenuImportFilePreviewRow[];
  validCount: number;
  invalidCount: number;
};

export type ParseMenuImportFileResult =
  | { ok: true; preview: MenuImportFilePreview }
  | { ok: false; error: string };
