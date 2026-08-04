import { API_BASE } from "./config"
import type { ApiFetch } from "@/lib/api/types"
import type { CancellationPolicy } from "@/lib/api/hotels"

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
    // Ventana de gracia de 2 horas desde que se creó la reserva: manda sobre todo lo demás.
    freeWindow: boolean
    daysToCheckin: number
    cancellationPolicy: CancellationPolicy | null
    // Único criterio para ofrecer "Solicitar cancelación" en el menú de la reserva.
    cancellableNow: boolean
    // Porcentaje del total que se retiene si cancela ahora (0 = sin costo).
    currentFeePct: number
    nextDeadline: string
    // Hora límite del próximo tramo ("17:00"). Opcional: sin ella el texto sólo lleva la fecha.
    deadlineTime?: string
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

// Detalle del servicio que el hotel puede ofrecer para resolver un requisito
// incumplido (p.ej. aplicar una vacuna al llegar). Alimenta el enlace + el modal.
// Los iconos vienen como clase lucide (p.ej. "lucide-heart-pulse" o
// "lucide lucide-shield-check") y se resuelven en el frontend.
export type BookingRequestServiceDetail = {
  id: number
  name: string
  // Texto del enlace en la fila del requisito.
  offerText: string
  type: string
  // Icono principal del modal (nombre lucide).
  icon: string | null
  // Título del modal (puede traer emoji).
  title: string
  // Cuerpo del modal. Puede traer saltos de línea y el token %PRICE% (→ price).
  description: string
  // Si false, no se muestra la barra de "focus" (assurance) del modal.
  focusMessage: boolean
  focusIcon: string | null
  focusText: string | null
}

export type BookingRequestServiceToOffer = {
  hotelServiceId: number
  hotelId: string
  serviceId: number
  price: number
  service: BookingRequestServiceDetail
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
  // "ALL" | "MALE" | "FEMALE": género de mascota al que aplica el requisito.
  genderApply?: string | null
  fileRequired: boolean
  // El backend puede omitir pets (o mandarlo null) en requisitos de nivel reserva.
  pets: BookingRequestPet[] | null
  // Servicio ofrecido para este requisito; ausente/null si hotel_service_id era null.
  serviceToOffer?: BookingRequestServiceToOffer | null
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

// Carrito de la reserva (sidebar "Resumen Reserva"). Se carga aparte, en paralelo,
// una vez que existe bookingId (lo devuelve /saveuser). Los montos finales
// (totalBookingAmount / payNowAmount) los calcula el backend; el frontend no suma.
export type BookingCartItems = {
  housing: { nightsCount: number; price: number }
  // Null cuando la reserva no incluye transporte.
  transport: { communeCode: string; price: number } | null
  // Servicios agregados (p.ej. vía addService). Puede venir vacío.
  services: { name: string; price: number }[]
}

export type BookingCart = {
  bookingId: string
  hotelId: string
  checkIn: string
  checkOut: string
  bookingStatus: string
  petCount: number
  // Códigos de tamaño ("SMALL" | "MEDIUM" | ...); usar PET_SIZE_LABEL para el nombre.
  petSizes: string[]
  items: BookingCartItems
  totalBookingAmount: number
  payNowAmount: number
}

export async function getBookingCart(bookingId: string, apiFetch: ApiFetch): Promise<BookingCart> {
  return apiFetch(`/api/booking/cart/${bookingId}`)
}

// Agrega a la reserva un servicio ofrecido (serviceToOffer) al confirmarlo en el modal.
// El body va en snake_case tal como lo espera el endpoint.
export type AddBookingServiceParams = {
  bookingId: string
  serviceId: number
  serviceName: string
  servicePrice: number
}

// Fila del servicio creada en la reserva. `id` es el bookingServiceId que necesita
// removeService para quitarlo luego.
export type AddBookingServiceResult = {
  id: number
  bookingId: string
  serviceId: number
  serviceName: string
  servicePrice: number
}

export async function addBookingService(params: AddBookingServiceParams, apiFetch: ApiFetch): Promise<AddBookingServiceResult> {
  return apiFetch("/api/bookings/addService", {
    method: "POST",
    body: JSON.stringify({
      booking_id: params.bookingId,
      service_id: params.serviceId,
      service_name: params.serviceName,
      service_price: params.servicePrice,
    }),
  })
}

// Quita de la reserva un servicio previamente agregado. bookingServiceId identifica
// la fila del servicio en la reserva (lo devuelve addService), NO es el serviceId del catálogo.
export async function removeBookingService(bookingServiceId: number, apiFetch: ApiFetch): Promise<void> {
  await apiFetch(`/api/bookings/removeService/${bookingServiceId}`, {
    method: "DELETE",
  })
}
