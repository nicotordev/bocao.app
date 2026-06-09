export type ImportableCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  avatar: string | null;
  sourceRestaurantId: string;
  sourceRestaurantName: string;
  sourceOrganizationId: string;
  sourceOrganizationName: string;
};

export type ImportableCustomersResponse = {
  customers: ImportableCustomer[];
};

export type ImportCustomersResult =
  | {
      ok: true;
      importedCustomers: number;
    }
  | {
      ok: false;
      error: string;
    };

export const IMPORT_CUSTOMER_FILE_FIELDS = [
  "name",
  "email",
  "phone",
  "documentId",
  "address",
  "notes",
  "avatar",
] as const;

export type ImportCustomerFileField =
  (typeof IMPORT_CUSTOMER_FILE_FIELDS)[number];

export type CustomerColumnMapping = Partial<
  Record<ImportCustomerFileField, string>
>;

export type NormalizedCustomerImportRow = {
  name: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  address: string | null;
  notes: string | null;
  avatar: string | null;
};

export type CustomerImportFilePreviewRow = {
  rowNumber: number;
  data?: NormalizedCustomerImportRow;
  errors: string[];
};

export type CustomerImportFilePreview = {
  headers: string[];
  suggestedMapping: CustomerColumnMapping;
  rows: CustomerImportFilePreviewRow[];
  validCount: number;
  invalidCount: number;
};

export type ParseCustomerImportFileResult =
  | { ok: true; preview: CustomerImportFilePreview }
  | { ok: false; error: string };
