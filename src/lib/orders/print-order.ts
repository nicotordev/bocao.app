import type { DashboardOrder, OrdersLabels } from "@/components/dashboard/orders/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildOrderTicketHtml(
  order: DashboardOrder,
  labels: OrdersLabels,
) {
  const statusLabel = labels.statuses[order.status as keyof typeof labels.statuses] || order.status;
  const channelLabel = labels.channels[order.channel as keyof typeof labels.channels] || order.channel;

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr class="item-row">
          <td class="qty">${escapeHtml(String(item.quantity))}</td>
          <td class="name">${escapeHtml(item.name)}</td>
          <td class="price">${escapeHtml(item.price)}</td>
        </tr>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Order ${escapeHtml(order.id)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 16px;
        color: #000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }
      .header {
        text-align: center;
        margin-bottom: 16px;
        border-bottom: 2px solid #000;
        padding-bottom: 12px;
      }
      h1 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 700;
      }
      .date {
        font-size: 12px;
        color: #444;
      }
      .section {
        margin-bottom: 16px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
        margin-bottom: 8px;
      }
      .meta-grid {
        display: grid;
        grid-template-cols: auto 1fr;
        gap: 4px 12px;
      }
      .meta-label {
        font-weight: 600;
        color: #333;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      .table th {
        font-size: 12px;
        text-align: left;
        border-bottom: 1px solid #000;
        padding-bottom: 6px;
        font-weight: 700;
      }
      .table td {
        padding: 6px 0;
        border-bottom: 1px dashed #eee;
      }
      .qty {
        width: 30px;
      }
      .price {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .summary-table {
        width: 100%;
        margin-top: 12px;
        border-top: 1px solid #000;
        padding-top: 8px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
      }
      .summary-row.total {
        font-weight: 700;
        font-size: 16px;
        border-top: 1px dashed #000;
        padding-top: 8px;
        margin-top: 4px;
      }
      .notes {
        background: #f9f9f9;
        border-left: 3px solid #ccc;
        padding: 8px 12px;
        font-style: italic;
        margin-top: 12px;
        border-radius: 4px;
      }
      @media print {
        body { padding: 0; }
        .notes { background: none; border-color: #000; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${escapeHtml(labels.drawer.title)} ${escapeHtml(order.id)}</h1>
      <p class="date">${escapeHtml(order.createdAt)}</p>
    </div>

    <div class="section">
      <div class="section-title">${escapeHtml(labels.drawer.general)}</div>
      <div class="meta-grid">
        <span class="meta-label">${escapeHtml(labels.table.status)}:</span>
        <span>${escapeHtml(statusLabel)}</span>
        <span class="meta-label">${escapeHtml(labels.table.channel)}:</span>
        <span>${escapeHtml(channelLabel)}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${escapeHtml(labels.drawer.customer)}</div>
      <div class="meta-grid">
        <span class="meta-label">${escapeHtml(labels.table.customer)}:</span>
        <span>${escapeHtml(order.customerName)}</span>
        <span class="meta-label">${escapeHtml(labels.drawer.phone)}:</span>
        <span>${escapeHtml(order.phone)}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${escapeHtml(labels.drawer.products)}</div>
      <table class="table">
        <thead>
          <tr>
            <th class="qty">Qty</th>
            <th class="name">Item</th>
            <th class="price" style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="summary-table">
        <div class="summary-row">
          <span>${escapeHtml(labels.drawer.subtotal)}</span>
          <span>${escapeHtml(order.summary.subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>${escapeHtml(labels.drawer.taxes)}</span>
          <span>${escapeHtml(order.summary.taxes)}</span>
        </div>
        <div class="summary-row total">
          <span>${escapeHtml(labels.drawer.total)}</span>
          <span>${escapeHtml(order.summary.total)}</span>
        </div>
      </div>
    </div>

    ${
      order.notes
        ? `
        <div class="section">
          <div class="section-title">${escapeHtml(labels.drawer.notes)}</div>
          <div class="notes">${escapeHtml(order.notes)}</div>
        </div>
        `
        : ""
    }
  </body>
</html>`;
}

export function printOrder(
  order: DashboardOrder,
  labels: OrdersLabels,
) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";

  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;

  if (!printWindow) {
    iframe.remove();
    throw new Error("PRINT_UNAVAILABLE");
  }

  printWindow.document.open();
  printWindow.document.write(buildOrderTicketHtml(order, labels));
  printWindow.document.close();

  const cleanup = () => {
    iframe.remove();
  };

  printWindow.addEventListener("afterprint", cleanup, { once: true });

  printWindow.focus();
  printWindow.print();

  window.setTimeout(cleanup, 60_000);
}
