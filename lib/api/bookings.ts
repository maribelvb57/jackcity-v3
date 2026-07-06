import { API_BASE } from "./config"
import type { ApiFetch } from "@/lib/api/types"

export type ConfirmBookingParams = {
  quoteId: string
  user: {
    userId: string | null
    firstName: string
    lastName: string
    email: string
    phone: string
    rut: string
    saveUserData: boolean
    address: {
      street: string
      apartment?: string
      commune: string
      city: string
      country: string
      reference?: string
    }
  }
  pets: {
    id: string | null
    breed: string
    size: string
    name: string
    gender: string
    weight?: number
    color?: string
    age?: number
  }[]
  transport?: {
    departureSlot: string
    returnSlot: string
  }
}

export type ConfirmBookingResult = {
  bookingId: string
  voucherToken: string
}

export type BookingDetail = {
  bookingId: string
  hotel: {
    name: string
    commune: string
    mainPhotoUrl: string | null
    checkinWindow: string
  }
  pets: { name: string }[]
  checkinDate: string
  checkoutDate: string
  transport: {
    included: boolean
    departureSlot?: string
    returnSlot?: string
  }
  pricing: {
    totalPrice: number
  }
  freeCancellationDeadline: string
}

export type MyBookingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "INITIATED"
  | "COMPLETED"
  | "CLOSED"
  | "EXPIRED"
  | "CANCELLED"
  | "NO_SHOW"

export type MyBooking = {
  id: string
  status: MyBookingStatus
  hotel: {
    id: string
    name: string
    city: string
    commune: string
    mainPhotoUrl: string | null
  }
  checkinDate: string
  checkoutDate: string
  pets: {
    id: string | null
    name: string
  }[]
  pricing: {
    totalPrice: number
    paidPrice: number
    pendingPrice: number
  }
  transport: {
    included: boolean
  }
  cancellation: {
    canCancel: boolean
    freeCancellationDeadline: string
    label: string
  }
  review: {
    hasReview: boolean
    score: number | null
    positiveComment: string | null
    negativeComment: string | null
  }
}

export type MyBookingsResponse = {
  bookings: MyBooking[]
}

export async function getBooking(bookingId: string, voucherToken?: string): Promise<BookingDetail> {
  const url = new URL(`${API_BASE}/api/bookings/${bookingId}`)
  if (voucherToken) url.searchParams.set("voucherToken", voucherToken)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Get booking failed: ${res.status}`)
  return res.json()
}

export async function getMyBookings(apiFetch: ApiFetch): Promise<MyBookingsResponse> {
  return apiFetch("/api/me/bookings")
}

export async function confirmBooking(params: ConfirmBookingParams): Promise<ConfirmBookingResult> {
  const res = await fetch(`${API_BASE}/api/bookings/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!res.ok) throw new Error(`Confirm booking failed: ${res.status}`)
  return res.json()
}
