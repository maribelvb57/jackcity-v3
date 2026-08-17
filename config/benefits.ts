// Filtros de "Tipo Alojamiento" del sidebar de /booking/search.
//
// El cruce NO se hace contra `hotel.benefits`: el endpoint /api/hotels/search
// devuelve un mapa `filters` con { CODE: [hotelId, ...] } y el filtrado se
// resuelve preguntando si el id del hotel está en la lista del código marcado.
// Cualquier código que venga en `filters` y no esté acá se ignora.
export const ACCOMMODATION_FILTERS = [
  { code: "SIN_CANILES", label: "Libre de Caniles" },
  { code: "CAMPESTRE", label: "Campestre / Áreas Verdes" },
  { code: "VET_ON_SITE", label: "Veterinario en el sitio" },
  { code: "CANILES_INDIVIDUALES", label: "Caniles Individuales" },
]
