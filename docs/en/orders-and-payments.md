# Orders and payments

Bocao treats **orders as the operational core** of the restaurant. Kitchen, POS-style flows, CRM, and future billing all sit on top of the same `Order` model. Payments are a **separate entity** linked to an order, with provider-agnostic fields so external PSPs (Stripe, Mercado Pago, Transbank, etc.) can be added later through adapters—not by rewriting order logic.

The POS is **not a separate system**. The kitchen “New order” dialog and `/dashboard/orders/new` are UI flows over `Order` + `Payment`.

---

## Design principles

| Principle                    | What it means in practice                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Order is the source of truth | Status, items, totals, customers, and kitchen queue all derive from `Order`.                                                                         |
| Payment is separate          | One order can have payments; method/provider/status live on `Payment`, not hardcoded on `Order`.                                                     |
| Internal enums first         | `PaymentMethod` describes _how_ the customer pays (cash, card, QR…). `PaymentProvider` describes _who processed it_ (manual today; Stripe tomorrow). |
| No PSP logic in the UI       | The dashboard never imports Stripe/MercadoPago SDKs. Adapters translate provider webhooks into Bocao events.                                         |
| Events after persistence     | Domain events are written to `AppEventLog` and optionally published over Redis for realtime.                                                         |
| Multi-tenant by restaurant   | Every mutation is scoped to `restaurantId` and checked against RBAC (`orders:write`).                                                                |

---

## Data model

Defined in `prisma/schema.prisma`.

### Order

| Field         | Role                                                           |
| ------------- | -------------------------------------------------------------- |
| `orderNumber` | Human-facing ID (unique per restaurant).                       |
| `status`      | Lifecycle state (see below).                                   |
| `type`        | Fulfillment: `DINE_IN`, `TAKEOUT`, `DELIVERY`.                 |
| `channel`     | Source key: `dineIn`, `whatsapp`, `pos`, `web`, etc.           |
| `tableNumber` | Optional table label for dine-in.                              |
| `totalCents`  | Persisted total; recalculated when items change.               |
| `notes`       | Operational notes (required on POS create).                    |
| `details`     | JSON: line items, summary, timeline, kitchen metadata, `kind`. |
| `customers`   | Optional links via `OrderCustomer`.                            |

### Payment

| Field                      | Role                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `method`                   | `CASH`, `CARD`, `TRANSFER`, `QR`, `OTHER`, `MANUAL_PENDING`. |
| `provider`                 | `MANUAL` today. Future: `STRIPE`, `MERCADOPAGO`, …           |
| `status`                   | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`.                |
| `amountCents` / `currency` | Snapshot at payment time.                                    |
| `externalRef`              | PSP payment intent / charge ID (empty for manual).           |
| `metadata`                 | Opaque JSON for adapter-specific data.                       |

Line items are stored inside `Order.details` (not a separate `OrderItem` table yet). Each stored line includes `priceCents` for safe recalculation on edit.

---

## Order lifecycle

### Database statuses (`OrderStatus`)

```
DRAFT → PENDING → CONFIRMED → PREPARING → READY → COMPLETED
                                                          ↘
                                                    CANCELLED
```

| DB status   | UI label (`Order.status`) | Kitchen                                 |
| ----------- | ------------------------- | --------------------------------------- |
| `DRAFT`     | `draft`                   | **Excluded** from kitchen queue         |
| `PENDING`   | `received`                | Enters queue on confirm                 |
| `CONFIRMED` | `confirmed`               | Active                                  |
| `PREPARING` | `preparing`               | Active (`in_preparation` in kitchen UI) |
| `READY`     | `ready`                   | Active                                  |
| `COMPLETED` | `delivered`               | Removed from active queue               |
| `CANCELLED` | `cancelled`               | Removed                                 |

Kitchen mapping lives in `src/lib/kitchen/kitchen-mapper.ts`. Draft exclusion is enforced in `src/lib/kitchen/list-filters.ts` and `src/lib/kitchen/kitchen-queue.ts`.

### POS intents

When creating an order from the kitchen or orders UI:

| Intent    | `Order.status` | Kitchen event                       | Payment status                                              |
| --------- | -------------- | ----------------------------------- | ----------------------------------------------------------- |
| `draft`   | `DRAFT`        | None                                | `PENDING` (always)                                          |
| `confirm` | `PENDING`      | `order.created` + `order.confirmed` | `COMPLETED` for cash/card/…; `PENDING` for `manual_pending` |

Confirming a saved draft: `POST /api/restaurants/:id/orders/:orderId` with `{ "action": "confirm" }` → `DRAFT` → `PENDING` and kitchen events fire.

---

## Order kind vs type vs channel

The POS form exposes **order kind** (user-facing). It resolves to Prisma `type` + `channel`:

| Order kind (UI)    | `Order.type` | `Order.channel` |
| ------------------ | ------------ | --------------- |
| `dineIn`           | `DINE_IN`    | `dineIn`        |
| `takeout`          | `TAKEOUT`    | `pos`           |
| `delivery`         | `DELIVERY`   | `pos`           |
| `whatsapp`         | `TAKEOUT`    | `whatsapp`      |
| `pos` (with table) | `DINE_IN`    | `pos`           |
| `pos` (no table)   | `TAKEOUT`    | `pos`           |

Resolver: `src/lib/orders/order-kind.ts`.

---

## API surface

All routes require dashboard session + restaurant membership. Writes require `orders:write`.

| Method  | Path                                              | Purpose                                                                                 |
| ------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `POST`  | `/api/restaurants/:restaurantId/orders`           | Create order (`intent`, `kind`, `items`, `notes`, `paymentMethod`, optional customers). |
| `GET`   | `/api/restaurants/:restaurantId/orders/:orderId`  | Fetch single order (includes payment).                                                  |
| `PATCH` | `/api/restaurants/:restaurantId/orders/:orderId`  | Update status **or** edit body (items, notes, payment method…).                         |
| `POST`  | `/api/restaurants/:restaurantId/orders/:orderId`  | `{ "action": "confirm" }` — draft → kitchen.                                            |
| `PATCH` | `/api/restaurants/:restaurantId/kitchen/:orderId` | Kitchen-specific updates (station, priority, prep status).                              |

Validation: `src/lib/orders/schemas.ts`, `src/lib/payments/schemas.ts`.

Business logic: `src/lib/orders/repository.ts`.

---

## Domain events

After successful DB commits, events are recorded in `AppEventLog` and published on the kitchen Redis channel when configured (`src/lib/realtime/event-log.ts`).

| Event                  | When                                     |
| ---------------------- | ---------------------------------------- |
| `order.created`        | Order enters kitchen queue               |
| `order.confirmed`      | Order confirmed (POS or draft promotion) |
| `order.updated`        | Items/notes/payment edited while active  |
| `order.cancelled`      | Status → `CANCELLED`                     |
| `order.status.changed` | Operational status transition in kitchen |
| `order.removed`        | Left kitchen queue (completed/cancelled) |
| `payment.created`      | Payment row inserted                     |
| `payment.updated`      | Payment method/status/amount changed     |

Event builders: `src/lib/orders/order-events.ts`. Payload types: `src/lib/realtime/types.ts`.

---

## Code map

```
src/lib/orders/
├── repository.ts          # Canonical order service (create, update, confirm, status)
├── context.ts             # getRestaurantOrderContext, buildOrderEventContext
├── mutation.ts            # executeOrderMutationWithEvents (tx + AppEventLog + Redis)
├── order-events.ts        # Domain event payload builders
├── order-details-json.ts  # Shared parseOrderDetailsJson helper
├── order-kind.ts          # kind → type + channel
├── order-mapper.ts        # Prisma → UI types
├── build-order-details.ts # items JSON + totals
├── date.ts                # Shared timezone/date helpers for mappers
└── schemas.ts             # Zod request bodies

src/lib/kitchen/
├── repository.ts          # Kitchen-specific updates (station, SLA, timeline)
└── kitchen-queue.ts       # IN_FLIGHT_ORDER_STATUSES (shared with floor-plan)

src/lib/payments/
├── types.ts               # UI-facing payment types
├── mapper.ts              # Prisma ↔ UI, status resolution
└── schemas.ts             # Zod validation

src/components/dashboard/orders/new/
└── new-order-form.tsx     # POS UI (draft / confirm)

src/components/dashboard/kitchen/
└── kitchen-new-order-dialog.tsx
```

### Reuse guidelines

| Need                                     | Use                                                |
| ---------------------------------------- | -------------------------------------------------- |
| Create / edit / confirm / cancel order   | `orders/repository.ts`                             |
| Kitchen station / pause / prep status    | `kitchen/repository.ts`                            |
| Restaurant currency/timezone/tenant      | `getRestaurantOrderContext()`                      |
| Persist + emit events                    | `executeOrderMutationWithEvents()`                 |
| Parse `order.details` JSON               | `parseOrderDetailsJson()`                          |
| Active order statuses (kitchen + tables) | `IN_FLIGHT_ORDER_STATUSES` from `kitchen-queue.ts` |

Kitchen mutations share the same event pipeline as orders but keep kitchen-specific field updates separate.

---

## Integrating a payment provider (e.g. Stripe)

Today every payment is `provider: MANUAL`. No webhook endpoints or SDK calls exist. The structure is intentionally ready for adapters.

### Target architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  POS / Web  │────▶│  Order service   │────▶│  Order + Payment │
│  checkout   │     │  (repository)    │     │  (PostgreSQL)    │
└─────────────┘     └────────┬─────────┘     └────────┬────────┘
                             │                          │
                    ┌────────▼─────────┐                │
                    │ Payment adapter  │◀───────────────┘
                    │ (Stripe, MP, …)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Provider webhook │
                    │ /api/webhooks/…  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Map to Bocao     │
                    │ payment.updated  │
                    │ order.confirmed  │
                    └──────────────────┘
```

### Step-by-step (Stripe example)

**1. Extend `PaymentProvider` enum**

```prisma
enum PaymentProvider {
  MANUAL
  STRIPE
}
```

Add migration via `bun run db:migrate -- --name add_stripe_provider`.

**2. Add adapter module** (suggested path: `src/lib/payments/adapters/stripe/`)

- `create-checkout-session.ts` — given `orderId`, `amountCents`, `currency`, return client secret or redirect URL.
- `handle-webhook.ts` — verify signature, parse `payment_intent.succeeded` / `payment_intent.payment_failed`.
- Never import Stripe in `repository.ts` or React components.

**3. Checkout flow**

1. Staff or customer confirms order → `Order` stays `DRAFT` or `PENDING`, `Payment` created with `provider: STRIPE`, `status: PENDING`, `method: CARD`.
2. UI calls adapter → Stripe Checkout / Payment Element.
3. Stripe redirects or webhook fires.
4. Webhook handler updates `Payment`:
   - `externalRef = payment_intent.id`
   - `status = COMPLETED | FAILED`
   - `metadata = { stripeEventId, … }`
5. Handler emits `payment.updated` (and `order.confirmed` if order was waiting on payment).

**4. Map provider events → Bocao events**

| Stripe event                    | Bocao action                                         |
| ------------------------------- | ---------------------------------------------------- |
| `payment_intent.succeeded`      | `Payment.status = COMPLETED`, emit `payment.updated` |
| `payment_intent.payment_failed` | `Payment.status = FAILED`, emit `payment.updated`    |
| `charge.refunded`               | `Payment.status = REFUNDED`, emit `payment.updated`  |

Use `buildPaymentUpdatedEvent()` from `order-events.ts` after the DB transaction—same pattern as manual flows.

**5. Idempotency**

- Store Stripe `event.id` in `Payment.metadata` or a dedicated `WebhookEvent` table.
- Ignore duplicate webhook deliveries.
- Match payments by `externalRef` (payment intent ID).

**6. Configuration (per restaurant or org)**

Future `RestaurantPaymentConfig` (not implemented yet) could hold encrypted API keys and enabled providers. Until then, use environment variables scoped by org in the adapter.

### Same pattern for other providers

| Provider     | `externalRef`       | Typical webhook         |
| ------------ | ------------------- | ----------------------- |
| Mercado Pago | `payment.id`        | `payment` notifications |
| Transbank    | `buy_order` / token | REST callback           |
| SumUp        | checkout ID         | payment status API      |

Each adapter implements the same internal contract:

```typescript
type PaymentAdapter = {
  provider: PaymentProvider;
  createPaymentSession(input: {
    orderId: string;
    amountCents: number;
    currency: string;
  }): Promise<{
    externalRef: string;
    clientSecret?: string;
    redirectUrl?: string;
  }>;
  handleProviderEvent(payload: unknown): Promise<{
    externalRef: string;
    status: PaymentStatus;
    metadata?: Record<string, unknown>;
  } | null>;
};
```

The order repository only calls adapters through this interface when `provider !== MANUAL`.

---

## What is intentionally out of scope (for now)

- Fiscal receipts / tax authority integration (SII, AFIP, etc.)
- Split payments, tips, or partial captures
- Automatic refunds from the dashboard
- Provider-specific UI widgets in the kitchen dialog
- `PaymentProvider` values other than `MANUAL` in production code

These should be added as adapters + thin API routes without changing the order lifecycle or kitchen queue rules.

---

## Related docs

- [Internationalization](./internationalization.md) — POS labels live in `dashboard.orders.new` message keys.
- [Licensing](./licensing.md) — Community Edition is AGPL-3.0.
