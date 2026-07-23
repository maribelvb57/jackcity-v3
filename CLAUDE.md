# API — reglas

El backend de JackCity vive en `/Users/maribelvb/projects-andes/jackcity-api`.

**No revisar ni depender de `/Users/maribelvb/projects-andes/jackcity-api/contracts`.** Esos contratos están desactualizados y no son fuente de verdad.

## Fuente de verdad

Maribel entrega directamente lo necesario para cada consumo de API (endpoint, request body, response body, nombres de campos, estructura JSON, errores esperados). Usa exactamente eso para ajustar types/interfaces, services, hooks y componentes.

- No inventar campos, estructuras, responses ni errores.
- Si falta un dato para implementar (un campo, un error, una estructura), no asumir ni hacer un workaround silencioso: detener esa parte y avisar a Maribel qué falta y por qué el frontend lo necesita, proponiendo una alternativa.

## Independencia

El frontend debe mantenerse técnicamente independiente del backend. Nunca importar, leer en build/runtime ni apuntar código a rutas del repo del backend.

## Dependencias

No agregar dependencias nuevas salvo que sea estrictamente necesario.

## Resumen al finalizar cualquier cambio relacionado con API

Entregar siempre:
- endpoint/spec que entregó Maribel y se usó
- archivos frontend modificados
- tipos/interfaces ajustados
- inconsistencias o datos faltantes encontrados
- temas que requieren decisión de Maribel
