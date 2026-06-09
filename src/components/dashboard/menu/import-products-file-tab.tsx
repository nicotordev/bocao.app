"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  importMenuProductsFromFileAction,
  previewMenuImportFileAction,
} from "@/app/actions/menu-import";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ColumnMapping,
  MenuImportFilePreview,
} from "@/lib/menu/import-products.types";
import { IMPORT_FILE_FIELDS } from "@/lib/menu/import-products.types";
import { getMenuImportTemplateUrl } from "@/lib/query/menu/import-products.api";
import { formatCurrency } from "@/lib/orders/currency";
import { cn } from "@/lib/utils";
import type { MenuPageLabels } from "./types";

type ImportProductsFileTabProps = {
  labels: MenuPageLabels["importProducts"];
  currency: string;
  restaurantId: string;
  onImportSuccess: () => void;
};

function errorMessageForCode(
  labels: MenuPageLabels["importProducts"],
  code: string,
) {
  switch (code) {
    case "INVALID_FILE_FORMAT":
      return labels.invalidFileFormat;
    case "FILE_TOO_LARGE":
      return labels.fileTooLarge;
    case "EMPTY_FILE":
      return labels.emptyFile;
    case "INVALID_ROWS":
    case "NO_VALID_ROWS":
      return labels.noValidRows;
    case "IMPORT_FAILED":
      return labels.importFailed;
    default:
      return labels.importFailed;
  }
}

export function ImportProductsFileTab({
  labels,
  currency,
  restaurantId,
  onImportSuccess,
}: ImportProductsFileTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MenuImportFilePreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isParsing, startParse] = useTransition();
  const [isImporting, startImport] = useTransition();

  function resetState() {
    setFile(null);
    setPreview(null);
    setColumnMapping({});
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function buildFormData(selectedFile: File, mapping?: ColumnMapping) {
    const formData = new FormData();
    formData.set("restaurantId", restaurantId);
    formData.set("file", selectedFile);

    if (mapping && Object.keys(mapping).length > 0) {
      formData.set("columnMapping", JSON.stringify(mapping));
    }

    return formData;
  }

  function runPreview(selectedFile: File, mapping?: ColumnMapping) {
    startParse(async () => {
      const result = await previewMenuImportFileAction(
        buildFormData(selectedFile, mapping),
      );

      if (!result.ok) {
        toast.error(errorMessageForCode(labels, result.error));
        return;
      }

      setPreview(result.preview);
      setColumnMapping(result.preview.suggestedMapping);
    });
  }

  function handleFileSelected(selectedFile: File | null) {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    runPreview(selectedFile);
  }

  function handleMappingChange(field: keyof ColumnMapping, header: string) {
    const nextMapping: ColumnMapping = {
      ...columnMapping,
      [field]: header === "__none__" ? undefined : header,
    };

    setColumnMapping(nextMapping);

    if (file) {
      runPreview(file, nextMapping);
    }
  }

  function handleImport() {
    if (!file || !preview || preview.validCount === 0) {
      toast.error(labels.noValidRows);
      return;
    }

    if (preview.invalidCount > 0) {
      toast.error(labels.invalidRows);
    }

    startImport(async () => {
      const result = await importMenuProductsFromFileAction(
        buildFormData(file, columnMapping),
      );

      if (!result.ok) {
        toast.error(errorMessageForCode(labels, result.error));
        return;
      }

      toast.success(labels.importCompleted);
      resetState();
      onImportSuccess();
    });
  }

  const needsMapping =
    preview &&
    IMPORT_FILE_FIELDS.some((field) => !preview.suggestedMapping[field]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="gap-2 rounded-2xl" asChild>
          <a href={getMenuImportTemplateUrl(restaurantId)} download>
            <Download className="size-4" aria-hidden />
            {labels.downloadTemplate}
          </a>
        </Button>

        <Button
          variant="outline"
          className="gap-2 rounded-2xl"
          onClick={() => inputRef.current?.click()}
          disabled={isParsing || isImporting}
        >
          <Upload className="size-4" aria-hidden />
          {labels.uploadFile}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
          onChange={(event) =>
            handleFileSelected(event.target.files?.[0] ?? null)
          }
        />
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center transition-colors hover:bg-muted/40",
          isParsing && "pointer-events-none opacity-60",
        )}
      >
        <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="font-medium">{labels.uploadFile}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {labels.dropFileHint}
        </p>
        {file ? (
          <p className="mt-3 text-sm text-foreground">{file.name}</p>
        ) : null}
      </button>

      {isParsing ? (
        <p className="text-sm text-muted-foreground">{labels.parsing}</p>
      ) : null}

      {preview ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>{labels.previewImport}</span>
            <span className="text-muted-foreground">
              {labels.validRows.replace("{count}", String(preview.validCount))}
            </span>
            {preview.invalidCount > 0 ? (
              <span className="text-destructive">
                {labels.invalidRowsCount.replace(
                  "{count}",
                  String(preview.invalidCount),
                )}
              </span>
            ) : null}
          </div>

          {(needsMapping || Object.keys(columnMapping).length > 0) &&
          preview.headers.length > 0 ? (
            <div className="rounded-3xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-medium">{labels.mapColumns}</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {IMPORT_FILE_FIELDS.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label>{labels.fields[field]}</Label>
                    <Select
                      value={columnMapping[field] ?? "__none__"}
                      onValueChange={(value) =>
                        handleMappingChange(field, value)
                      }
                    >
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {preview.headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {labels.importConfirmed}
          </p>

          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-3xl border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium">{labels.row}</th>
                  <th className="px-4 py-3 font-medium">
                    {labels.fields.categoryName}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {labels.fields.productName}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {labels.fields.price}
                  </th>
                  <th className="px-4 py-3 font-medium">{labels.errors}</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={cn(
                      "border-b border-border/70",
                      row.errors.length > 0 && "bg-destructive/5",
                    )}
                  >
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">
                      {row.data?.categoryName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.data?.productName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.data
                        ? formatCurrency(row.data.priceCents, currency)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-destructive">
                      {row.errors.length > 0 ? row.errors.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 justify-end">
            <Button
              className="rounded-2xl"
              disabled={preview.validCount === 0 || isImporting}
              onClick={handleImport}
            >
              {isImporting ? labels.importing : labels.confirmImport}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
