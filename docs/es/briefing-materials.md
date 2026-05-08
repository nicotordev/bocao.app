# Resumen de **Bocao.app** (en español)

## Qué es

**Bocao.app** es una plataforma SaaS **multi-tenant** pensada como **sistema operativo para restaurantes**, con **IA**, **automatización** y **comunicación** en un solo lugar. La idea no es solo “gestionar”, sino **asistir con inteligencia** al negocio.

## Visión

Convertirse en el **sistema operativo moderno** para restaurantes en **Latinoamérica** y más allá. El problema que ataca es el software viejo, lento y **fragmentado** (muchas herramientas sueltas).

## Concepto central

Centraliza en una sola plataforma:

- Pedidos y reservas
- **WhatsApp** y soporte con IA
- Cocina y operaciones
- Analítica, personal y automatización
- Marketing

## A quién apunta

**Principalmente:** restaurantes pequeños y medianos, cadenas de comida rápida, cafés, sushi, cocinas fantasma, food trucks.
**También:** grupos, franquicias, bares, panaderías, dark kitchens.

**Geografía:** empieza en **Chile, México y Colombia**, con miras a **LatAm** y el mercado **hispano en EE. UU.**

## Problemas que intenta resolver

Pedidos por WhatsApp a mano, reservas perdidas, soporte lento, comunicación sin centro, poca analítica, cocina ineficiente, poca automatización, POS antiguos y **demasiadas herramientas desconectadas**.

## Posicionamiento

**Es:** moderno, nativo en IA, mobile-first, orientado a automatización, visualmente limpio, rápido y fácil.
**No es:** ERP legacy, software enterprise enrevesado ni “POS feo de 2012”.

## Funciones principales (alto nivel)

1. **Asistente de WhatsApp con IA** — respuestas, menú, reservas, pedidos, FAQs, multilenguaje, transcripción de notas de voz.
2. **Dashboard** — ingresos, pedidos, reservas, métricas, insights de IA.
3. **Gestión de cocina** — cola, estados, tiempos, tiempo real, pantallas.
4. **Reservas** — mesas, agenda, recordatorios, historial.
5. **CRM** — perfiles, platos favoritos, frecuencia, segmentos, lealtad.
6. **Marketing con IA** — campañas, textos para redes, promos, WhatsApp, reactivación.
7. **Personal y operaciones** — roles, turnos, notas internas.

## IA (más allá del chat)

- **Copiloto:** responde clientes, genera promos, resume analítica, sugiere acciones.
- **Analítica en lenguaje natural** (ejemplos tipo “las ventas bajaron X%”, “esto vende mejor a tal hora”).
- **Voz** (opcional): pedidos por voz, asistente telefónico, voz a texto.

## Negocio

**Suscripción SaaS** en niveles tipo Starter / Growth / Enterprise.
**Extras:** uso de API de WhatsApp, créditos de IA, SMS, analítica premium, white-label, integraciones a medida.

## Stack técnico sugerido

Frontend: **Next.js, React, TypeScript, Tailwind v4, shadcn/ui**.
Backend: **Node, PostgreSQL, Prisma, Redis, colas (BullMQ/PgBoss)**.
Infra: **Docker**, hosting tipo **Railway/Hetzner**, **Cloudflare**, almacenamiento tipo **S3**.
IA: **OpenAI**, embeddings, agentes, APIs en tiempo real.
Integraciones: **WhatsApp Cloud API, Stripe, Twilio, Google Maps**; delivery tipo Uber Eats “futuro”.

## Ventaja competitiva

Competencia a menudo: UI vieja, sin IA, difícil y cara. Bocao apuesta por **UX moderna**, flujos **nativos de IA**, enfoque **WhatsApp-first**, automatización y dashboards claros, **pensado para móvil**.

## Alcance del MVP (por fases)

- **Fase 1:** auth, onboarding, dashboard, inbox WhatsApp, respuestas IA, reservas, gestión de pedidos.
- **Fase 2:** analítica, insights IA, CRM, campañas, pantallas de cocina.
- **Fase 3:** IA de voz, franquicias, automatizaciones avanzadas, ecosistema API.

## Diseño y marca

**Dark mode first**, paleta cálida “comida”, toques de glassmorphism, estética SaaS moderna. Inspiración: Linear, Stripe, Vercel, Toast, Shopify, Notion.
Colores: **naranja/rojo cálido**, **carbón oscuro**, acento **lima / aguacate**.

## SEO / palabras clave

Términos como “software de restaurantes con IA”, automatización, pedidos por WhatsApp, CRM restaurante, asistente IA, plataforma inteligente, operaciones, reservas con IA.

## Visión largo plazo

Evolucionar hacia **“el sistema operativo con IA para negocios de hospitalidad”**, ampliando a hoteles, bares, cafés, eventos, cloud kitchens y cadenas.

## Pitch en una frase

> Bocao es un sistema operativo para restaurantes con IA que automatiza comunicación con clientes, reservas, cocina y marketing en una sola plataforma moderna.

Si quieres, en un siguiente mensaje puedo **condensarlo a 1 párrafo para inversores**, **a bullets para la web**, o **alinear el MVP con lo que ya tengas en el repo**.
