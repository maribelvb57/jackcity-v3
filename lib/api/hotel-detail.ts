import type { ApiFetch } from "@/lib/api/types"

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

export type HotelDetail = {
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
  benefits: HotelDetailBenefit[]
  transport: HotelDetailTransport | null
  pricing: {
    bookingPrice: number | null
    transportPrice: number
    totalPrice: number | null
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
  const data = await params.apiFetch<{ hotel: HotelDetail; transport?: HotelDetailTransport | null; pricing?: HotelDetail["pricing"] }>(
    "/api/hotels/booking-detail",
    { method: "POST", body: JSON.stringify(body) }
  )

  return {
    ...data.hotel,
    transport: data.transport ?? null,
    pricing: data.pricing ?? null,
  }
}
