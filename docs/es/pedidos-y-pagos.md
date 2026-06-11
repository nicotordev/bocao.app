# Pedidos y pagos

Bocao trata los **pedidos como el núcleo operativo** del restaurante. Cocina, flujos tipo POS, CRM y futura facturación se apoyan en el mismo modelo `Order`. Los pagos son una **entidad separada** vinculada al pedido, con campos agnósticos al proveedor para integrar después PSPs externos (Stripe, Mercado Pago, Transbank, etc.) mediante adaptadores—sin reescribir la lógica de pedidos.

El POS **no es un sistema aparte**. El diálogo “Nuevo pedido” en cocina y `/dashboard/orders/new` son flujos de UI sobre `Order` + `Payment`.

---

## Principios de diseño

| Principio                        | En la práctica                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| El pedido es la fuente de verdad | Estado, ítems, totales, clientes y cola de cocina derivan de `Order`.                                                                                |
| El pago es independiente         | Un pedido puede tener pagos; método/proveedor/estado viven en `Payment`, no hardcodeados en `Order`.                                                 |
| Enums internos primero           | `PaymentMethod` describe _cómo_ paga el cliente (efectivo, tarjeta, QR…). `PaymentProvider` describe _quién_ lo procesó (manual hoy; Stripe mañana). |
| Sin lógica de PSP en la UI       | El dashboard no importa SDKs de Stripe/MercadoPago. Los adaptadores traducen webhooks del proveedor a eventos Bocao.                                 |
| Eventos después de persistir     | Los eventos de dominio se guardan en `AppEventLog` y opcionalmente se publican en Redis para realtime.                                               |
| Multi-tenant por restaurante     | Toda mutación va scoped a `restaurantId` y se valida con RBAC (`orders:write`).                                                                      |

---

## Modelo de datos

Definido en `prisma/schema.prisma`.

### Order (pedido)

| Campo         | Rol                                                       |
| ------------- | --------------------------------------------------------- |
| `orderNumber` | ID visible (único por restaurante).                       |
| `status`      | Estado del ciclo de vida (ver abajo).                     |
| `type`        | Fulfillment: `DINE_IN`, `TAKEOUT`, `DELIVERY`.            |
| `channel`     | Origen: `dineIn`, `whatsapp`, `pos`, `web`, etc.          |
| `tableNumber` | Mesa opcional para presencial.                            |
| `totalCents`  | Total persistido; se recalcula al editar ítems.           |
| `notes`       | Notas operativas (obligatorias al crear desde POS).       |
| `details`     | JSON: líneas, resumen, timeline, metadata cocina, `kind`. |
| `customers`   | Vínculos opcionales vía `OrderCustomer`.                  |

### Payment (pago)

| Campo                      | Rol                                                          |
| -------------------------- | ------------------------------------------------------------ |
| `method`                   | `CASH`, `CARD`, `TRANSFER`, `QR`, `OTHER`, `MANUAL_PENDING`. |
| `provider`                 | `MANUAL` hoy. Futuro: `STRIPE`, `MERCADOPAGO`, …             |
| `status`                   | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`.                |
| `amountCents` / `currency` | Snapshot al momento del pago.                                |
| `externalRef`              | ID del PSP (payment intent, cargo, etc.). Vacío en manual.   |
| `metadata`                 | JSON opaco para datos del adaptador.                         |

Los ítems viven en `Order.details` (aún no hay tabla `OrderItem` separada). Cada línea guardada incluye `priceCents` para recalcular totales al editar.

---

## Ciclo de vida del pedido

### Estados en base de datos (`OrderStatus`)

```
DRAFT → PENDING → CONFIRMED → PREPARING → READY → COMPLETED
                                                          ↘
                                                    CANCELLED
```

| Estado DB   | Etiqueta UI (`Order.status`) | Cocina                                 |
| ----------- | ---------------------------- | -------------------------------------- |
| `DRAFT`     | `draft`                      | **Excluido** de la cola                |
| `PENDING`   | `received`                   | Entra al confirmar                     |
| `CONFIRMED` | `confirmed`                  | Activo                                 |
| `PREPARING` | `preparing`                  | Activo (`in_preparation` en UI cocina) |
| `READY`     | `ready`                      | Activo                                 |
| `COMPLETED` | `delivered`                  | Sale de cola activa                    |
| `CANCELLED` | `cancelled`                  | Eliminado / cancelado                  |

Mapeo cocina: `src/lib/kitchen/kitchen-mapper.ts`. Exclusión de borradores: `src/lib/kitchen/list-filters.ts` y `src/lib/kitchen/kitchen-queue.ts`.

### Intenciones POS

Al crear desde cocina o pedidos:

| Intención | `Order.status` | Evento cocina                       | Estado del pago                                                    |
| --------- | -------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `draft`   | `DRAFT`        | Ninguno                             | `PENDING` (siempre)                                                |
| `confirm` | `PENDING`      | `order.created` + `order.confirmed` | `COMPLETED` para efectivo/tarjeta/…; `PENDING` si `manual_pending` |

Confirmar un borrador: `POST /api/restaurants/:id/orders/:orderId` con `{ "action": "confirm" }` → `DRAFT` → `PENDING` y se emiten eventos de cocina.

---

## Tipo de pedido vs type vs channel

El formulario POS expone **order kind** (lo que ve el usuario). Se resuelve a `type` + `channel` en Prisma:

| Tipo (UI)        | `Order.type` | `Order.channel` |
| ---------------- | ------------ | --------------- |
| `dineIn`         | `DINE_IN`    | `dineIn`        |
| `takeout`        | `TAKEOUT`    | `pos`           |
| `delivery`       | `DELIVERY`   | `pos`           |
| `whatsapp`       | `TAKEOUT`    | `whatsapp`      |
| `pos` (con mesa) | `DINE_IN`    | `pos`           |
| `pos` (sin mesa) | `TAKEOUT`    | `pos`           |

Resolver: `src/lib/orders/order-kind.ts`.

---

## API

Todas las rutas requieren sesión de dashboard + membresía al restaurante. Escritura: `orders:write`.

| Método  | Ruta                                              | Propósito                                                                                |
| ------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `POST`  | `/api/restaurants/:restaurantId/orders`           | Crear pedido (`intent`, `kind`, `items`, `notes`, `paymentMethod`, clientes opcionales). |
| `GET`   | `/api/restaurants/:restaurantId/orders/:orderId`  | Obtener pedido (incluye pago).                                                           |
| `PATCH` | `/api/restaurants/:restaurantId/orders/:orderId`  | Cambiar estado **o** editar cuerpo (ítems, notas, método de pago…).                      |
| `POST`  | `/api/restaurants/:restaurantId/orders/:orderId`  | `{ "action": "confirm" }` — borrador → cocina.                                           |
| `PATCH` | `/api/restaurants/:restaurantId/kitchen/:orderId` | Actualizaciones de cocina (estación, prioridad, estado prep).                            |

Validación: `src/lib/orders/schemas.ts`, `src/lib/payments/schemas.ts`.

Lógica de negocio: `src/lib/orders/repository.ts`.

---

## Eventos de dominio

Tras commit en DB, los eventos se registran en `AppEventLog` y se publican en el canal Redis de cocina si está configurado (`src/lib/realtime/event-log.ts`).

| Evento                 | Cuándo                                          |
| ---------------------- | ----------------------------------------------- |
| `order.created`        | El pedido entra a cola de cocina                |
| `order.confirmed`      | Pedido confirmado (POS o promoción de borrador) |
| `order.updated`        | Se editan ítems/notas/pago estando activo       |
| `order.cancelled`      | Estado → `CANCELLED`                            |
| `order.status.changed` | Transición operativa en cocina                  |
| `order.removed`        | Sale de cola (completado/cancelado)             |
| `payment.created`      | Se inserta fila de pago                         |
| `payment.updated`      | Cambia método/estado/monto del pago             |

Builders: `src/lib/orders/order-events.ts`. Tipos: `src/lib/realtime/types.ts`.

---

## Mapa de código

```
src/lib/orders/
├── repository.ts          # Servicio canónico de pedidos (crear, editar, confirmar, estado)
├── context.ts             # getRestaurantOrderContext, buildOrderEventContext
├── mutation.ts            # executeOrderMutationWithEvents (tx + AppEventLog + Redis)
├── order-events.ts        # Builders de eventos de dominio
├── order-details-json.ts  # Helper compartido parseOrderDetailsJson
├── order-kind.ts          # kind → type + channel
├── order-mapper.ts        # Prisma → tipos UI
├── build-order-details.ts # JSON de ítems + totales
├── date.ts                # Helpers de fecha/zona horaria para mappers
└── schemas.ts             # cuerpos Zod

src/lib/kitchen/
├── repository.ts          # Actualizaciones de cocina (estación, SLA, timeline)
└── kitchen-queue.ts       # IN_FLIGHT_ORDER_STATUSES (compartido con floor-plan)

src/lib/payments/
├── types.ts               # tipos de pago en UI
├── mapper.ts              # Prisma ↔ UI, resolución de estado
└── schemas.ts             # validación Zod

src/components/dashboard/orders/new/
└── new-order-form.tsx     # UI POS (borrador / confirmar)

src/components/dashboard/kitchen/
└── kitchen-new-order-dialog.tsx
```

### Guía de reutilización

| Necesidad                                    | Usar                                             |
| -------------------------------------------- | ------------------------------------------------ |
| Crear / editar / confirmar / cancelar pedido | `orders/repository.ts`                           |
| Estación / pausa / estado de prep en cocina  | `kitchen/repository.ts`                          |
| Moneda/timezone/tenant del restaurante       | `getRestaurantOrderContext()`                    |
| Persistir + emitir eventos                   | `executeOrderMutationWithEvents()`               |
| Parsear JSON de `order.details`              | `parseOrderDetailsJson()`                        |
| Estados activos (cocina + mesas)             | `IN_FLIGHT_ORDER_STATUSES` en `kitchen-queue.ts` |

Las mutaciones de cocina comparten el mismo pipeline de eventos que pedidos, pero mantienen separados los campos específicos de cocina.

---

## Integrar un proveedor de pago (ej. Stripe)

Hoy todo pago es `provider: MANUAL`. No hay webhooks ni llamadas a SDKs. La estructura está lista para adaptadores.

### Arquitectura objetivo

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  POS / Web  │────▶│  Servicio Order  │────▶│  Order + Payment │
│  checkout   │     │  (repository)    │     │  (PostgreSQL)    │
└─────────────┘     └────────┬─────────┘     └────────┬────────┘
                             │                          │
                    ┌────────▼─────────┐                │
                    │ Adaptador pago   │◀───────────────┘
                    │ (Stripe, MP, …)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Webhook proveedor│
                    │ /api/webhooks/…  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Mapeo a eventos  │
                    │ payment.updated  │
                    │ order.confirmed  │
                    └──────────────────┘
```

### Pasos (ejemplo Stripe)

**1. Extender enum `PaymentProvider`**

```prisma
enum PaymentProvider {
  MANUAL
  STRIPE
}
```

Migrar con `bun run db:migrate -- --name add_stripe_provider`.

**2. Módulo adaptador** (ruta sugerida: `src/lib/payments/adapters/stripe/`)

- `create-checkout-session.ts` — dado `orderId`, `amountCents`, `currency`, devuelve client secret o URL de redirect.
- `handle-webhook.ts` — verifica firma, parsea `payment_intent.succeeded` / `payment_intent.payment_failed`.
- No importar Stripe en `repository.ts` ni en componentes React.

**3. Flujo de checkout**

1. Staff o cliente confirma → `Order` en `DRAFT` o `PENDING`, `Payment` con `provider: STRIPE`, `status: PENDING`, `method: CARD`.
2. UI llama al adaptador → Stripe Checkout / Payment Element.
3. Redirect de Stripe o llega webhook.
4. El handler actualiza `Payment`:
   - `externalRef = payment_intent.id`
   - `status = COMPLETED | FAILED`
   - `metadata = { stripeEventId, … }`
5. Emite `payment.updated` (y `order.confirmed` si el pedido esperaba el pago).

**4. Mapeo eventos proveedor → Bocao**

| Evento Stripe                   | Acción Bocao                                           |
| ------------------------------- | ------------------------------------------------------ |
| `payment_intent.succeeded`      | `Payment.status = COMPLETED`, emitir `payment.updated` |
| `payment_intent.payment_failed` | `Payment.status = FAILED`, emitir `payment.updated`    |
| `charge.refunded`               | `Payment.status = REFUNDED`, emitir `payment.updated`  |

Usar `buildPaymentUpdatedEvent()` de `order-events.ts` después de la transacción—mismo patrón que flujos manuales.

**5. Idempotencia**

- Guardar `event.id` de Stripe en `Payment.metadata` o tabla `WebhookEvent`.
- Ignorar webhooks duplicados.
- Emparejar pagos por `externalRef` (payment intent ID).

**6. Configuración (por restaurante u org)**

Un futuro `RestaurantPaymentConfig` (no implementado) podría guardar API keys cifradas y proveedores habilitados. Por ahora, variables de entorno en el adaptador.

### Mismo patrón para otros proveedores

| Proveedor    | `externalRef`       | Webhook típico           |
| ------------ | ------------------- | ------------------------ |
| Mercado Pago | `payment.id`        | notificaciones `payment` |
| Transbank    | `buy_order` / token | callback REST            |
| SumUp        | checkout ID         | API de estado            |

Contrato interno común del adaptador:

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

El repositorio de pedidos solo invoca adaptadores cuando `provider !== MANUAL`.

---

## Fuera de alcance (por ahora)

- Boletas / integración tributaria (SII, AFIP, etc.)
- Pagos divididos, propinas o capturas parciales
- Reembolsos automáticos desde el dashboard
- Widgets de proveedor embebidos en el diálogo de cocina
- Valores de `PaymentProvider` distintos de `MANUAL` en código productivo

Esto debe sumarse como adaptadores + rutas API finas, sin cambiar el ciclo del pedido ni las reglas de la cola de cocina.

---

## Documentación relacionada

- [Internacionalización](./internacionalizacion.md) — etiquetas POS en `dashboard.orders.new`.
- [Licenciamiento](./licensing.md) — Community Edition bajo AGPL-3.0.
