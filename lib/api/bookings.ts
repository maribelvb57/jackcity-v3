const API_BASE = "http://localhost:8080"

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

export async function getBooking(bookingId: string): Promise<BookingDetail> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`)
  if (!res.ok) throw new Error(`Get booking failed: ${res.status}`)
  return res.json()
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
