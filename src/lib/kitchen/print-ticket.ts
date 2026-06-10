import type {
  KitchenChannel,
  KitchenOrder,
  KitchenPriority,
  KitchenStation,
  KitchenOrderStatus,
} from "@/lib/kitchen/types";

export type KitchenTicketPrintLabels = {
  ticket: {
    table: string;
    noItems: string;
    kitchenNote: string;
    importantNote: string;
    minutes: string;
  };
  drawer: {
    destination: string;
    channel: string;
    station: string;
    receivedAt: string;
    status: string;
    priority: string;
    sla: string;
    assignee: string;
    items: string;
    allergens: string;
    notes: string;
  };
  channels: Record<KitchenChannel, string>;
  stations: Record<KitchenStation, string>;
  statuses: Record<KitchenOrderStatus, string> & { deliveredLate: string };
  priorities: Record<KitchenPriority, string>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resolveDestination(order: KitchenOrder, tableLabel: string) {
  if (order.tableNumber) {
    return `${tableLabel} ${order.tableNumber}`;
  }

  return order.customerName ?? "—";
}

function buildItemsHtml(order: KitchenOrder, labels: KitchenTicketPrintLabels) {
  if (order.items.length === 0) {
    return `<p class="muted">${escapeHtml(labels.ticket.noItems)}</p>`;
  }

  return order.items
    .map((item) => {
      const modifiers = item.modifiers?.length
        ? `<ul class="modifiers">${item.modifiers
            .map((modifier) => `<li>${escapeHtml(modifier)}</li>`)
            .join("")}</ul>`
        : "";

      const allergens = item.allergens?.length
        ? `<p class="allergen">${escapeHtml(labels.drawer.allergens)}: ${escapeHtml(item.allergens.join(", "))}</p>`
        : "";

      const notes = item.notes
        ? `<p class="note">${escapeHtml(labels.drawer.notes)}: ${escapeHtml(item.notes)}</p>`
        : "";

      return `
        <article class="item">
          <p class="item-name">${escapeHtml(String(item.quantity))}x ${escapeHtml(item.name)}</p>
          ${modifiers}
          ${allergens}
          ${notes}
        </article>
      `;
    })
    .join("");
}

function buildKitchenTicketHtml(
  order: KitchenOrder,
  labels: KitchenTicketPrintLabels,
) {
  const statusLabel =
    order.status === "delayed"
      ? labels.statuses.delayed
      : labels.statuses[order.status];

  const notesBlock = [
    order.kitchenNotes
      ? `<p class="highlight">${escapeHtml(labels.ticket.kitchenNote)}: ${escapeHtml(order.kitchenNotes)}</p>`
      : "",
    order.importantNote
      ? `<p class="important">${escapeHtml(labels.ticket.importantNote)}: ${escapeHtml(order.importantNote)}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(order.number)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 12px;
        color: #111;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 22px;
        letter-spacing: 0.04em;
      }
      .meta {
        margin: 0 0 12px;
        padding-bottom: 10px;
        border-bottom: 1px dashed #999;
      }
      .meta p { margin: 0 0 4px; }
      .muted { color: #555; }
      .items { margin-top: 12px; }
      .item {
        margin: 0 0 10px;
        padding-bottom: 8px;
        border-bottom: 1px dotted #ccc;
      }
      .item-name {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 700;
      }
      .modifiers {
        margin: 0;
        padding-left: 16px;
      }
      .modifiers li { margin: 0 0 2px; }
      .allergen, .note, .highlight, .important {
        margin: 4px 0 0;
      }
      .allergen { font-weight: 700; }
      .important {
        font-weight: 700;
        text-transform: uppercase;
      }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(order.number)}</h1>
    <div class="meta">
      <p><strong>${escapeHtml(labels.drawer.destination)}:</strong> ${escapeHtml(resolveDestination(order, labels.ticket.table))}</p>
      <p><strong>${escapeHtml(labels.drawer.channel)}:</strong> ${escapeHtml(labels.channels[order.channel])}</p>
      <p><strong>${escapeHtml(labels.drawer.station)}:</strong> ${escapeHtml(labels.stations[order.station])}</p>
      <p><strong>${escapeHtml(labels.drawer.receivedAt)}:</strong> ${escapeHtml(order.receivedAt)}</p>
      <p><strong>${escapeHtml(labels.drawer.status)}:</strong> ${escapeHtml(statusLabel)}</p>
      <p><strong>${escapeHtml(labels.drawer.priority)}:</strong> ${escapeHtml(labels.priorities[order.priority])}</p>
      <p><strong>${escapeHtml(labels.drawer.sla)}:</strong> ${escapeHtml(String(order.slaMinutes))} ${escapeHtml(labels.ticket.minutes)}</p>
      ${
        order.assignedTo
          ? `<p><strong>${escapeHtml(labels.drawer.assignee)}:</strong> ${escapeHtml(order.assignedTo)}</p>`
          : ""
      }
    </div>
    <section class="items">
      <p class="muted"><strong>${escapeHtml(labels.drawer.items)}</strong></p>
      ${buildItemsHtml(order, labels)}
    </section>
    ${notesBlock}
  </body>
</html>`;
}

export function printKitchenTicket(
  order: KitchenOrder,
  labels: KitchenTicketPrintLabels,
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
  printWindow.document.write(buildKitchenTicketHtml(order, labels));
  printWindow.document.close();

  const cleanup = () => {
    iframe.remove();
  };

  printWindow.addEventListener("afterprint", cleanup, { once: true });

  printWindow.focus();
  printWindow.print();

  window.setTimeout(cleanup, 60_000);
}
