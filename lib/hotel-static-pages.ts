/**
 * URLs estáticas de hoteles: /hoteles-para-perros/{comuna}/{keyName}.
 *
 * keyName es el slug con el que se consulta /api/hotels/by-key/{keyName}/page.
 * Sólo estas combinaciones existen: la ruta usa dynamicParams = false, así que
 * cualquier otro par comuna/slug responde 404.
 */
export type HotelStaticPage = {
  comuna: string
  keyName: string
}

export const HOTEL_STATIC_PAGES: HotelStaticPage[] = [
  { comuna: "santiago-centro", keyName: "peluditos" },
  { comuna: "la-florida", keyName: "la-guarderia-de-bruno" },
  { comuna: "colina", keyName: "hotel-canino-mantra" },
  { comuna: "penaflor", keyName: "hotel-campestre" },
  { comuna: "pirque", keyName: "perry-lodge" },
  { comuna: "chicureo", keyName: "el-patio-guarderia" },
]
