# Contratos API — reglas obligatorias

El backend de JackCity vive en `/Users/maribelvb/projects-andes/jackcity-api`. Sus contratos API están en `/Users/maribelvb/projects-andes/jackcity-api/contracts`.

**Los contratos son propiedad del backend.** Desde el frontend se leen como referencia, nunca se modifican.

## Regla principal

Antes de implementar, modificar o corregir cualquier consumo de API desde el frontend, revisa primero `/Users/maribelvb/projects-andes/jackcity-api/contracts`.

Usa esos contratos como fuente de verdad para:
- request body
- response body
- nombres de campos
- estructura JSON
- errores esperados
- tipos/interfaces del frontend

No inventes campos, estructuras, responses ni errores.

## Prohibido

No editar, borrar, mover ni crear archivos dentro de `/Users/maribelvb/projects-andes/jackcity-api/contracts`. Esa carpeta es solo lectura desde este proyecto.

## Si el contrato existe

- Úsalo exactamente como está.
- Ajusta los types/interfaces del frontend a ese contrato.
- Ajusta services, hooks y componentes para respetarlo.

## Si el contrato no existe, está incompleto, no coincide con lo que necesita la UI, le falta un campo, tiene un campo con nombre dudoso, o impide implementar correctamente la funcionalidad

- NO modificar el contrato.
- NO inventar un workaround silencioso.
- NO asumir campos nuevos.
- Detener esa parte del cambio si depende del contrato.
- Avisar claramente a Maribel qué problema se encontró:
  - archivo/contrato revisado
  - qué campo, estructura o endpoint falta
  - por qué el frontend lo necesita
  - una alternativa de solución propuesta, sin aplicarla al contrato

## Si hay diferencia entre frontend y contrato

- El contrato del backend es la fuente de verdad.
- Corregir el frontend si corresponde.
- Si el contrato parece incorrecto, reportarlo a Maribel pero no editarlo.

## Independencia

El frontend debe mantenerse técnicamente independiente del backend. La carpeta de contratos se consulta solo como referencia de desarrollo, nunca como dependencia runtime (no importar, no leer en build/runtime, no apuntar código a esa ruta).

## Dependencias

No agregar dependencias nuevas salvo que sea estrictamente necesario.

## Resumen al finalizar cualquier cambio relacionado con API

Entregar siempre:
- contrato consultado
- archivos frontend modificados
- tipos/interfaces ajustados
- inconsistencias encontradas
- temas que requieren decisión de Maribel
- cambios sugeridos para backend/contracts, si aplica

## Regla final

Frontend lee contratos. Backend edita contratos. Maribel decide cuándo un contrato debe cambiar.
