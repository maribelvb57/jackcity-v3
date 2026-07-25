import type { ApiFetch } from "@/hooks/use-api-client"

export type HotelBookingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "INITIATED"
  | "PENDING_CANCELLATION"
  | "COMPLETED"
  | "CLOSED"
  | "EXPIRED"
  | "CANCELLED"
  | "NO_SHOW"

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
  // Número de reserva legible para el usuario (lo entrega GET /api/hotel/bookings/{hotelId}).
  number: string
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
  // Evaluaciones del tutor. Una por sección: alojamiento y/o transporte.
  // Sin reseñas → array vacío.
  reviews: BookingReview[]
  createdAt: string
}

export type BookingReviewType = "HOUSING" | "TRANSPORT"

export interface BookingReview {
  type: BookingReviewType
  stars: number
  goodThings: string | null
  badThings: string | null
  reviewDate: string
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

// Respuesta genérica de las transiciones de estado desde el panel del hotel.
export interface HotelBookingStatusResponse {
  bookingId: string
  status: HotelBookingStatus
}

// HOTEL_MGR/ADMIN confirma una reserva pagada: PAID → CONFIRMED. Sin request body.
export async function confirmHotelBooking(
  bookingId: string,
  apiFetch: ApiFetch
): Promise<HotelBookingStatusResponse> {
  return apiFetch<HotelBookingStatusResponse>(
    `/api/hotel/bookings/${bookingId}/confirm`,
    { method: "POST" }
  )
}

// HOTEL_MGR/ADMIN hace el check-in de una reserva confirmada: CONFIRMED → INITIATED. Sin request body.
export async function checkInHotelBooking(
  bookingId: string,
  apiFetch: ApiFetch
): Promise<HotelBookingStatusResponse> {
  return apiFetch<HotelBookingStatusResponse>(
    `/api/hotel/bookings/${bookingId}/checkin`,
    { method: "POST" }
  )
}

// HOTEL_MGR/ADMIN hace el check-out de una reserva en curso: INITIATED → COMPLETED. Sin request body.
export async function checkOutHotelBooking(
  bookingId: string,
  apiFetch: ApiFetch
): Promise<HotelBookingStatusResponse> {
  return apiFetch<HotelBookingStatusResponse>(
    `/api/hotel/bookings/${bookingId}/checkout`,
    { method: "POST" }
  )
}

// HOTEL_MGR/ADMIN marca que el huésped no se presentó: CONFIRMED → NO_SHOW. Sin request body.
export async function markNoShowHotelBooking(
  bookingId: string,
  apiFetch: ApiFetch
): Promise<HotelBookingStatusResponse> {
  return apiFetch<HotelBookingStatusResponse>(
    `/api/hotel/bookings/${bookingId}/no-show`,
    { method: "POST" }
  )
}
