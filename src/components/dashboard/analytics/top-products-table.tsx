"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAnalyticsCurrency } from "@/lib/analytics/format";
import type { TopProduct } from "@/lib/analytics/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsLabels } from "./types";

type TopProductsTableProps = {
  title: string;
  data: TopProduct[];
  labels: AnalyticsLabels;
  currency: string;
  locale: string;
};

export function TopProductsTable({
  title,
  data,
  labels,
  currency,
  locale,
}: TopProductsTableProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty.description}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.table.product}</TableHead>
                <TableHead className="text-right">{labels.table.quantity}</TableHead>
                <TableHead className="text-right">{labels.table.revenue}</TableHead>
                <TableHead className="text-right">{labels.table.share}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product) => (
                <TableRow key={`${product.productId ?? product.name}`}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAnalyticsCurrency(product.revenue, currency, locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.sharePercent}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
