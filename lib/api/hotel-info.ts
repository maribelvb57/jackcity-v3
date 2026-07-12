import type { ApiFetch } from "@/lib/api/types"

export type HotelInfoPolicy = {
  description: string
  confirmationRequired: boolean
}

export type HotelInfoBenefit = {
  name: string
}

export type HotelInfoUser = {
  name: string
  lastName: string
  email: string
}

export type HotelInfoResponse = {
  hotel: {
    name: string
    status: string
    offersTransport: boolean
    addressStreet: string
    commune: string
    communeCode: string
    avgRating: number
    reviewsCount: number
    reviewText: string | null
    reviewUserName: string | null
    description: string | null
    checkinTime: string
    checkoutTime: string
    policies: HotelInfoPolicy[]
    benefits: HotelInfoBenefit[]
  }
  pricing: Record<string, number>
  discounts: Record<string, number>
  transport_prices: Record<string, number>
  usuarios: HotelInfoUser[]
}

export async function getHotelInfo(hotelId: string, apiFetch: ApiFetch): Promise<HotelInfoResponse> {
  return apiFetch(`/api/hotel/info/${hotelId}`)
}
