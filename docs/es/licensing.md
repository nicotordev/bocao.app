# Licenciamiento

Bocao.app usa un modelo de **licencia dual** para poder ofrecerse comercialmente y, al mismo tiempo, compartirse con la comunidad.

## Ediciones

| Edición | Dónde | Licencia | Para quién |
| --- | --- | --- | --- |
| **Comunidad** | Este repositorio de GitHub | [AGPL-3.0](../../LICENSE) | Desarrolladores, contribuidores, self-hosting, evaluación |
| **Comercial** | Directamente del autor | [Licencia Comercial](../../COMMERCIAL-LICENSE.md) | Compradores que necesitan términos propietarios sin obligaciones copyleft |

## ¿Por qué AGPL-3.0 para la edición comunidad?

Bocao.app es un sistema operativo para restaurantes pensado para despliegue hospedado (estilo SaaS). **AGPL-3.0** es una licencia copyleft fuerte que:

- Permite usar, estudiar, modificar y redistribuir el código fuente.
- Exige compartir modificaciones al distribuir el software.
- Extiende el copyleft al **uso en red** — si ejecutas una versión modificada como servicio público, debes ofrecer el código fuente correspondiente a los usuarios que interactúan con él por la red.

Esto protege el proyecto de competidores que tomen el código comunitario, lo mejoren en privado y vendan un producto hospedado sin aportar cambios de vuelta.

## ¿Por qué licencia dual?

Como titular del copyright, el autor puede licenciar el mismo código bajo términos distintos:

1. **Gratis / abierto** bajo AGPL-3.0 en GitHub — se aceptan contribuciones de la comunidad.
2. **De pago / propietario** mediante licencia comercial directa — los compradores reciben términos propietarios sin obligaciones AGPL.

Es el mismo patrón usado por Qt, MongoDB (históricamente) y otros proyectos que publican una edición comunitaria junto a una licencia comercial.

> **Importante:** Los titulares de licencia comercial y quienes clonan desde GitHub reciben **licencias distintas**. Comprar una licencia comercial no otorga exenciones AGPL; clonar desde GitHub no otorga derechos de redistribución comercial.

## ¿Qué edición elegir?

### Usa la Edición Comunidad (AGPL-3.0) si:

- Quieres auto-hospedar para tu propio restaurante.
- Planeas contribuir mejoras de vuelta al proyecto.
- Estás evaluando el stack antes de comprar una licencia comercial.
- Aceptas las obligaciones AGPL para cualquier despliegue público/hospedado.

### Compra la Edición Comercial si:

- Quieres revender o white-label sin copyleft AGPL.
- Necesitas mantener modificaciones privadas en un producto hospedado.
- Quieres una licencia que no exija divulgación del código fuente.

## Contribuir

Al contribuir a este repositorio, aceptas que tus contribuciones se licencian bajo AGPL-3.0. Ver [CONTRIBUTING.md](../../.github/CONTRIBUTING.md).

## Dependencias de terceros

Las dependencias en `package.json` tienen sus propias licencias (MIT, Apache-2.0, etc.). La AGPL-3.0 aplica al código fuente de Bocao.app en este repositorio, no a los paquetes upstream.

## Preguntas

- Preguntas sobre comunidad / AGPL: abre una [GitHub Discussion](https://github.com/nicotordev/bocao.app/discussions) o Issue.
- Licenciamiento comercial: abre un [GitHub Issue](https://github.com/nicotordev/bocao.app/issues) o Discussion.
