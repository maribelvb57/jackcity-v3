import type { ApiFetch } from "@/lib/api/types"
import type { CancellationPolicy } from "@/lib/api/hotels"

export type HotelDetailBenefit = {
  name: string
}

export type HotelDetailPolicy = {
  description: string
  confirmationRequired: boolean
}

export type HotelDetailTransport = {
  departureSlots: string[]
  returnSlots: string[]
}

// Foto de la galería del hotel. El orden de exhibición lo manda sortOrder,
// no la posición en el array (ver getHotelBookingDetail).
export type HotelDetailPhoto = {
  url: string
  caption: string | null
  sortOrder: number
}

export type HotelDetail = {
  // id del registro de búsqueda de esta vista de detalle. Se devuelve tal cual al
  // crear la cotización (POST /api/quotes). Null si el backend no lo pudo guardar.
  searchHotelId: number | null
  name: string
  addressStreet: string | null
  commune: string | null
  communeCode: string | null
  avgRating: number | null
  reviewsCount: number | null
  reviewText: string | null
  reviewUserName: string | null
  description: string | null
  checkinTime: string | null
  checkoutTime: string | null
  policies: HotelDetailPolicy[]
  cancellationPolicy: CancellationPolicy | null
  benefits: HotelDetailBenefit[]
  photos: HotelDetailPhoto[]
  transport: HotelDetailTransport | null
  pricing: {
    bookingPrice: number | null
    transportPrice: number
    totalPrice: number | null
    // Monto a pagar al reservar. Lo calcula el backend; el frontend no lo deriva del total.
    payNowAmount: number
  } | null
}

export type PetPayload = {
  id: string | null
  breed: string
  size: string
}

export async function getHotelBookingDetail(params: {
  hotelId: string
  city: string
  pets: PetPayload[]
  checkinDate: string
  checkoutDate: string
  needsTransport: boolean
  transportBy?: string
  transportCommune?: string
  searchId: string
  listIndex: number
  apiFetch: ApiFetch
}): Promise<HotelDetail> {
  const body: Record<string, unknown> = {
    hotelId: params.hotelId,
    city: params.city,
    checkinDate: params.checkinDate,
    checkoutDate: params.checkoutDate,
    needsTransport: params.needsTransport,
    ...(params.transportBy && { transportBy: params.transportBy }),
    ...(params.needsTransport && params.transportCommune && { transportCommune: params.transportCommune }),
    searchId: params.searchId,
    listIndex: params.listIndex,
    pets: params.pets,
  }

  // apiFetch agrega Authorization (bearer si hay sesión) + X-Visitor-Id / X-Session-Id.
  const data = await params.apiFetch<{
    searchHotelId: number | null
    hotel: Omit<HotelDetail, "searchHotelId">
    transport?: HotelDetailTransport | null
    pricing?: HotelDetail["pricing"]
  }>(
    "/api/hotels/booking-detail",
    { method: "POST", body: JSON.stringify(body) }
  )

  // Las fotos se ordenan acá por sortOrder para que la galería no dependa del
  // orden en que vengan en el array.
  const photos = [...(data.hotel.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    ...data.hotel,
    searchHotelId: data.searchHotelId ?? null,
    photos,
    transport: data.transport ?? null,
    pricing: data.pricing ?? null,
  }
}
