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
  | "PENDING_CANCELLATION"
  | "COMPLETED"
  | "CLOSED"
  | "EXPIRED"
  | "CANCELLED"
  | "NO_SHOW"

export type MyBooking = {
  id: string
  // Número de reserva legible para el usuario (lo entrega GET /api/me/bookings).
  number: string
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

export async function confirmBooking(params: ConfirmBookingParams, apiFetch: ApiFetch): Promise<ConfirmBookingResult> {
  return apiFetch("/api/bookings/confirm", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// Paso 1 del flujo por secciones: guarda los datos del tutor ("Mis datos").
// address es opcional: por ahora la sección 1 no captura dirección (ver /booking/confirmation).
export type SaveBookingUserParams = {
  quoteId: string
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string
    rut: string
    saveUserData: boolean
    address?: {
      street: string
      number?: string
      apartment?: string
      commune: string
      city: string
      country: string
      reference?: string
    }
  }
}

export type SaveBookingUserResult = {
  userId: string | null
  // bookingId de la reserva creada en este paso; requerido para encadenar /savepets.
  bookingId: string
}

export async function saveBookingUser(params: SaveBookingUserParams, apiFetch: ApiFetch): Promise<SaveBookingUserResult> {
  return apiFetch("/api/bookings/confirm/saveuser", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// Paso 2 del flujo por secciones: guarda las mascotas ("Mis mascotas").
// pet.id va en null cuando el usuario no está logueado (se crean nuevas mascotas).
export type SaveBookingPetsParams = {
  quoteId: string
  userId: string | null
  // bookingId devuelto por /saveuser; requerido para asociar las mascotas a la reserva.
  bookingId: string
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
}

export type SaveBookingPetsResult = {
  petIds: string[]
}

export async function saveBookingPets(params: SaveBookingPetsParams, apiFetch: ApiFetch): Promise<SaveBookingPetsResult> {
  return apiFetch("/api/bookings/confirm/savepets", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// Paso 3 del flujo por secciones: trae los requisitos del hotel para pintar la sección.
// El backend responde por requisito (cada request con su pets[] anidado). El frontend
// pivotea a "por mascota" para el render; los textos no se duplican en el payload.
export type GetBookingRequestsParams = {
  bookingId: string
}

export type BookingRequestPet = {
  petId: string
  petName: string
  // breed llega como breed-code; usar getBreedByCode para el nombre visible.
  breed: string
  gender: string
  foundValidFile: boolean
  petDocumentId: string | null
  validUntil: string | null
}

export type BookingRequest = {
  id: number
  title: string
  description: string | null
  status: string
  documentType: string | null
  fileText: string | null
  fileTypes: string[] | null
  maxFileSize: number | null
  // "FILE" (UploadCloud) | "PHOTO" (Camera) | otros → fallback a UploadCloud
  icon: string | null
  reviewerText: string | null
  fileRequired: boolean
  // El backend puede omitir pets (o mandarlo null) en requisitos de nivel reserva.
  pets: BookingRequestPet[] | null
}

export type GetBookingRequestsResult = {
  bookingId: string
  checkOut: string
  requests: BookingRequest[]
}

export async function getBookingRequests(params: GetBookingRequestsParams, apiFetch: ApiFetch): Promise<GetBookingRequestsResult> {
  return apiFetch("/api/bookings/confirm/getrequests", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// Paso 4 del flujo por secciones: crea la reserva y devuelve lo mismo que el viejo /confirm
// (bookingId + voucherToken), para continuar con el pago Webpay.
// transport es opcional y por ahora se omite (se sumará más adelante).
export type GoToPayParams = {
  quoteId: string
  // bookingId devuelto por /saveuser; requerido para finalizar la reserva y pasar al pago.
  bookingId: string
  transport?: {
    departureSlot: string
    returnSlot: string
  }
}

export async function gotoPay(params: GoToPayParams, apiFetch: ApiFetch): Promise<ConfirmBookingResult> {
  return apiFetch("/api/bookings/confirm/gotopay", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// Solicitud de cancelación desde /mis-reservas. El usuario confirma la cancelación
// y opcionalmente incluye un motivo. La respuesta no se usa por ahora.
export type CancellationRequestParams = {
  bookingId: string
  cancellationReason: string
}

export async function requestBookingCancellation(params: CancellationRequestParams, apiFetch: ApiFetch): Promise<void> {
  await apiFetch("/api/bookings/cancellation-request", {
    method: "POST",
    body: JSON.stringify(params),
  })
}
