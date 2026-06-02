const API_BASE = "http://localhost:8080"

export type HotelDetailBenefit = {
  name: string
}

export type HotelDetailPolicy = {
  description: string
  confirmationRequired: boolean
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

  const res = await fetch(`${API_BASE}/api/hotels/booking-detail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Hotel detail failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    ...data.hotel,
    pricing: data.pricing ?? null,
  }
}
