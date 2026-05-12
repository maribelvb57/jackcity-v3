---
name: Usar clases estándar de Tailwind para espaciados
description: Preferencia de usar siempre las clases de Tailwind estándar para spacing, sizing y otros valores, salvo que el usuario pida explícitamente un valor custom
type: feedback
---

Usar siempre clases estándar de Tailwind (pb-96, mt-4, px-6, etc.) para espaciados, tamaños y valores de layout. No usar valores inline arbitrarios (style={{ paddingBottom: 400 }}) salvo que el usuario lo pida explícitamente.

**Why:** El usuario lo indicó explícitamente al ver un `pb-96` siendo el estándar correcto en vez de un valor inline.

**How to apply:** En cualquier cambio de CSS/layout, priorizar las clases de Tailwind sobre estilos inline arbitrarios. Si el valor exacto no existe en Tailwind, elegir el más cercano disponible.
