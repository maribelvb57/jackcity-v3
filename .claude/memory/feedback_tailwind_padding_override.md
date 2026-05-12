---
name: No mezclar p-X con pb-X en Tailwind
description: Evitar combinar clases p-X (shorthand) con pb-X, pt-X, etc. en el mismo elemento porque puede generar conflictos según el orden de generación del CSS
type: feedback
---

No combinar `p-4` (o `p-X`) con `pb-X` en el mismo elemento. Tailwind puede pisar el override dependiendo del orden en que genera el CSS.

**Why:** El `pb-96` no se aplicaba porque `p-4 md:p-6` lo sobreescribía en el CSS generado.

**How to apply:** Cuando se necesite padding distinto en cada lado, usar siempre las clases explícitas: `px-4 pt-4 pb-96` en lugar de `p-4 pb-96`.
