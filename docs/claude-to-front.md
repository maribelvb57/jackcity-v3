# Integración Frontend — Endpoint de Búsqueda de Hoteles

## Visión general

Este endpoint devuelve la lista de hoteles disponibles que coinciden con los filtros de búsqueda del usuario. La respuesta ya incluye precios calculados y opciones de transporte resueltas, por lo que el frontend solo necesita mostrar los datos.

---

## Endpoint

```
POST /api/hotels/search
Content-Type: application/json
```

**Autenticación:** No requerida. El endpoint es público.

---

## Request

### Estructura

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `city` | `string` | Sí | Código de ciudad (ej. `"SAN"` para Santiago) |
| `pets` | `array` | Sí | Lista de mascotas a hospedar (1–3 ítems) |
| `pets[].size` | `string` | Sí | Tamaño de la mascota. Ver enum de tamaños. |
| `startDate` | `string` | Sí | Fecha de ingreso en formato `YYYY-MM-DD` |
| `endDate` | `string` | Sí | Fecha de salida en formato `YYYY-MM-DD` |
| `needTransport` | `boolean` | Sí | `true` si el usuario necesita servicio de transporte |
| `communeCode` | `string` | Cond. | Código de la comuna del usuario. Requerido cuando `needTransport = true`. |

### Enum: tamaños de mascota (`pets[].size`)

| Valor | Descripción |
|---|---|
| `SMALL` | Pequeño |
| `MEDIUM` | Mediano |
| `LARGE` | Grande |
| `EXTRA_LARGE` | Extra grande |

### Validaciones

- `pets` debe tener entre 1 y 3 elementos.
- `endDate` debe ser posterior a `startDate`.
- Si `needTransport = true` y no se envía `communeCode`, el servidor puede devolver resultados vacíos (no hay error 400, simplemente no habrá hoteles con transporte disponible a esa comuna).

### Ejemplo de request

```json
{
  "city": "SAN",
  "pets": [
    { "size": "SMALL" },
    { "size": "MEDIUM" }
  ],
  "startDate": "2026-06-15",
  "endDate": "2026-06-20",
  "needTransport": true,
  "communeCode": "LAS_CONDES"
}
```

---

## Response

La respuesta es un **array** de hoteles disponibles. Si ningún hotel cumple los filtros, se devuelve un array vacío `[]`.

**HTTP 200 OK**

### Estructura de cada hotel

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | `string (UUID)` | No | Identificador único del hotel |
| `name` | `string` | No | Nombre del hotel |
| `description` | `string` | Sí | Descripción del hotel |
| `addressStreet` | `string` | Sí | Dirección |
| `commune` | `string` | Sí | Código de la comuna donde está el hotel |
| `region` | `string` | Sí | Región |
| `lat` | `number` | Sí | Latitud (para mostrar en mapa) |
| `lng` | `number` | Sí | Longitud (para mostrar en mapa) |
| `phone` | `string` | Sí | Teléfono de contacto |
| `email` | `string` | Sí | Email de contacto |
| `avgRating` | `number` | Sí | Calificación promedio (0.0–5.0) |
| `reviewsCount` | `number` | Sí | Cantidad de reseñas |
| `petSizes` | `string[]` | No | Tamaños de mascota que acepta el hotel. Ver enum de tamaños. |
| `mainBenefits` | `array` | No | Beneficios destacados del hotel (puede ser array vacío) |
| `mainBenefits[].name` | `string` | No | Nombre del beneficio (ej. `"Piscina"`, `"Cámara 24h"`) |
| `pricing` | `object` | Sí | Resumen de precios calculado. `null` si no hay tarifa configurada. |
| `transport` | `object` | Sí | Información del transporte. `null` si `needTransport = false`. |

### Objeto `pricing`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `bookingPrice` | `number` | Sí | Precio del hospedaje (incluye descuento si aplica). `null` si no hay tarifa configurada para el tamaño de alguna mascota. |
| `transportPrice` | `number` | No | Precio del transporte. `0` si no se solicitó transporte. |
| `totalPrice` | `number` | Sí | Suma de `bookingPrice + transportPrice`. `null` si `bookingPrice` es `null`. |

> Los precios están en pesos chilenos (CLP) sin decimales.

### Objeto `transport`

Presente solo cuando `needTransport = true`. Indica quién provee el transporte y los horarios disponibles para el día de ingreso y salida.

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `provider` | `string` | No | Quién hace el transporte. Ver valores posibles abajo. |
| `startDateSlots` | `string[]` | Sí | Horarios disponibles para el día de ingreso. `null` si el proveedor es el hotel. |
| `endDateSlots` | `string[]` | Sí | Horarios disponibles para el día de salida. `null` si el proveedor es el hotel. |

**Valores de `provider`:**

| Valor | Descripción |
|---|---|
| `HOTEL` | El hotel gestiona su propio transporte. Los slots no aplican; el usuario coordina directamente con el hotel. |
| `JACKCITY` | JackCity provee el transporte. El usuario debe elegir un slot de horario para el día de ingreso y otro para el día de salida. |

**Valores de slots de horario** (cuando `provider = JACKCITY`):

| Valor | Franja |
|---|---|
| `AM` | Mañana |
| `MD` | Mediodía |
| `PM` | Tarde |

> El array de slots solo contiene las franjas con capacidad disponible. Si `JACKCITY` aparece como proveedor, los slots siempre tendrán al menos 1 elemento.

---

## Ejemplo de respuesta

```json
[
  {
    "id": "b0000001-0000-0000-0000-000000000001",
    "name": "Hotel Patitas Felices",
    "description": "Hotel para perros en Santiago",
    "addressStreet": "Av. Apoquindo 4500",
    "commune": "PROVIDENCIA",
    "region": "Metropolitana",
    "lat": -33.432000,
    "lng": -70.610000,
    "phone": "+56912345678",
    "email": "contacto@patitasfelices.cl",
    "avgRating": 4.5,
    "reviewsCount": 38,
    "petSizes": ["SMALL", "MEDIUM", "LARGE"],
    "mainBenefits": [
      { "name": "Piscina" },
      { "name": "Cámara 24h" }
    ],
    "pricing": {
      "bookingPrice": 112500,
      "transportPrice": 8000,
      "totalPrice": 120500
    },
    "transport": {
      "provider": "HOTEL",
      "startDateSlots": null,
      "endDateSlots": null
    }
  },
  {
    "id": "b0000002-0000-0000-0000-000000000002",
    "name": "Hotel Huellitas",
    "description": "Cuidado premium para tu mascota",
    "addressStreet": "Calle Los Aromos 231",
    "commune": "MAIPU",
    "region": "Metropolitana",
    "lat": -33.510000,
    "lng": -70.760000,
    "phone": "+56987654321",
    "email": "info@huellitas.cl",
    "avgRating": 4.8,
    "reviewsCount": 112,
    "petSizes": ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"],
    "mainBenefits": [
      { "name": "Paseos diarios" }
    ],
    "pricing": {
      "bookingPrice": 98000,
      "transportPrice": 12000,
      "totalPrice": 110000
    },
    "transport": {
      "provider": "JACKCITY",
      "startDateSlots": ["AM", "MD"],
      "endDateSlots": ["PM"]
    }
  },
  {
    "id": "b0000003-0000-0000-0000-000000000003",
    "name": "Hotel El Refugio",
    "description": "...",
    "pricing": {
      "bookingPrice": 85000,
      "transportPrice": 0,
      "totalPrice": 85000
    },
    "transport": null
  }
]
```

---

## Comportamiento del filtro (para entender qué hoteles aparecen)

El backend aplica cuatro filtros en cadena. Si un hotel falla cualquiera de ellos, **no aparece en la lista**:

1. **Tamaños de mascota:** el hotel debe aceptar todos los tamaños de las mascotas enviadas en el request.
2. **Transporte** (solo si `needTransport = true`): el hotel debe tener transporte disponible hacia la comuna del usuario, ya sea propio o vía JackCity. Si no hay ninguna opción, el hotel se descarta.
3. **Disponibilidad nocturna:** el hotel debe tener capacidad disponible en cada noche del rango de fechas solicitado.
4. **Precio:** se calcula al final para los hoteles que pasaron los filtros anteriores.

---

## Casos especiales a manejar en el frontend

| Situación | Cómo llega la data | Sugerencia de UI |
|---|---|---|
| Sin transporte solicitado | `transport: null` | No mostrar sección de transporte |
| Transporte gestionado por el hotel | `provider: "HOTEL"`, slots `null` | Mostrar "El hotel coordina el transporte" sin selector de horario |
| Transporte JackCity | `provider: "JACKCITY"`, slots con valores | Mostrar selector de horario para día de ingreso y día de salida |
| Sin tarifa configurada | `pricing: null` o `pricing.bookingPrice: null` | Mostrar "Precio no disponible" |
| Lista vacía `[]` | El array de respuesta está vacío | Mostrar estado vacío: "No encontramos hoteles disponibles para tu búsqueda" |

---

## Errores HTTP

| Código | Cuándo ocurre |
|---|---|
| `400 Bad Request` | Request inválido: campo obligatorio faltante, `pets` fuera del rango 1–3, formato de fecha incorrecto. El body del error describe el campo con el problema. |
| `500 Internal Server Error` | Error inesperado del servidor. |
