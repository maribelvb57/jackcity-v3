import type { ApiFetch } from "@/lib/api/types"
import type { PetPayload } from "@/lib/api/hotel-detail"

export type TransportProvider = "HOTEL" | "JACKCITY"

export type AvailabilityPricing = {
  housingPrice: number
  transportPrice: number
  totalPrice: number
  // Monto a pagar al reservar. Lo calcula el backend; el frontend no lo deriva del total.
  payNowAmount: number
}

export type AvailabilityTransport = {
  provider: TransportProvider
  startDateSlots: string[]
  endDateSlots: string[]
}

/**
 * Respuesta de POST /api/hotels/availability-check.
 *
 * El backend valida en orden y corta en la primera condición que no se cumple:
 * sólo `bookingAvailable` y `hotelActive` vienen siempre. Los demás flags
 * aparecen hasta donde llegó la validación, así que "ausente" significa
 * "no se alcanzó a evaluar", no "false".
 */
export type HotelAvailability = {
  // uuid del hotel consultado. Es lo que espera POST /api/quotes (acá sólo
  // manejamos el keyName de la URL).
  hotelId: string
  bookingAvailable: boolean
  hotelActive: boolean
  hotelAllowPetsSizes?: boolean
  hotelOpenOnDates?: boolean
  hotelTransportAvailable?: boolean
  jackcityTransportAvailable?: boolean
  housingAvailable?: boolean
  // id del registro de búsqueda de esta consulta. Se devuelve tal cual al crear
  // la cotización (POST /api/quotes).
  searchHotelId?: number | null
  // Sólo cuando pasaron todas las condiciones.
  pricing?: AvailabilityPricing
  transport?: AvailabilityTransport
}

/** Datos de la búsqueda que originó la consulta. Se conservan para el resumen. */
export type AvailabilitySearch = {
  city: string
  checkinDate: string
  checkoutDate: string
  needsTransport: boolean
  transportCommune: string | null
  pets: PetPayload[]
}

export async function checkHotelAvailability(params: {
  hotelKeyName: string
  search: AvailabilitySearch
  apiFetch: ApiFetch
}): Promise<HotelAvailability> {
  const { search } = params
  const body: Record<string, unknown> = {
    hotelKeyName: params.hotelKeyName,
    city: search.city,
    checkinDate: search.checkinDate,
    checkoutDate: search.checkoutDate,
    needsTransport: search.needsTransport,
    ...(search.needsTransport && search.transportCommune && { transportCommune: search.transportCommune }),
    pets: search.pets,
  }

  // apiFetch agrega Authorization (bearer si hay sesión) + X-Visitor-Id / X-Session-Id.
  return params.apiFetch("/api/hotels/availability-check", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export type AvailabilityFailureReason =
  | "HOTEL_INACTIVE"
  | "PETS_NOT_ALLOWED"
  | "HOTEL_CLOSED_ON_DATES"
  | "NO_TRANSPORT"
  | "NO_HOUSING"
  | "UNKNOWN"

/**
 * Motivo por el que la búsqueda no tiene disponibilidad. Se evalúa en el mismo
 * orden en que valida el backend y gana la primera condición que falló.
 */
export function getAvailabilityFailureReason(availability: HotelAvailability): AvailabilityFailureReason {
  if (!availability.hotelActive) return "HOTEL_INACTIVE"
  if (availability.hotelAllowPetsSizes === false) return "PETS_NOT_ALLOWED"
  if (availability.hotelOpenOnDates === false) return "HOTEL_CLOSED_ON_DATES"
  if (availability.hotelTransportAvailable === false && availability.jackcityTransportAvailable === false) {
    return "NO_TRANSPORT"
  }
  if (availability.housingAvailable === false) return "NO_HOUSING"
  return "UNKNOWN"
}
