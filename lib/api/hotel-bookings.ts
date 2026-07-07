import type { ApiFetch } from "@/hooks/use-api-client"

export type HotelBookingStatus = "PENDING_PAYMENT" | "PAID" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

export type TransportSlot = "AM" | "MD" | "PM"

export interface BookingPet {
  id: string
  name: string
  species?: "DOG" | "CAT" | null
  size?: "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE" | null
  breedId?: number | null
  breedName?: string | null
  gender?: "MALE" | "FEMALE" | null
  weight?: number | null
  birthDate?: string | null
  color?: string | null
  notes?: string | null
  vaccines?: Record<string, string> | null
}

export interface HotelBooking {
  id: string
  status: HotelBookingStatus
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  checkinDate: string
  checkoutDate: string
  pets: BookingPet[]
  pricing: {
    totalPrice: number
    paidPrice: number
    pendingPrice: number
  }
  transport: {
    included: boolean
    pickupCommune?: string | null
    departure?: { date: string; slot: TransportSlot } | null
    return?: { date: string; slot: TransportSlot } | null
  }
  createdAt: string
}

export interface HotelBookingsResponse {
  bookings: HotelBooking[]
}

export async function getHotelBookings(
  hotelId: string,
  apiFetch: ApiFetch
): Promise<HotelBookingsResponse> {
  return apiFetch<HotelBookingsResponse>(`/api/hotel/bookings/${hotelId}`)
}
