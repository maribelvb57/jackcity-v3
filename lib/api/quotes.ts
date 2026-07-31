import type { PetPayload } from "./hotel-detail"
import type { ApiFetch } from "@/lib/api/types"

export type QuoteHotel = {
  id: string
  name: string
  addressStreet: string
  commune: string
  mainPhotoUrl: string | null
  checkinTime: string | null
  checkoutTime: string | null
  policies: { description: string; confirmationRequired: boolean }[]
}

export type Quote = {
  quoteId: string
  hotel: QuoteHotel
  pricing: {
    bookingPrice: number
    transportPrice: number
    totalPrice: number
    // Monto a pagar ahora (lo calcula el backend). Alimenta "A pagar ahora" del resumen.
    payNowAmount: number
  }
  transport: {
    departureSlots: string[]
    returnSlots: string[]
  }
  pets: PetPayload[]
  checkinDate: string
  checkoutDate: string
  needsTransport: boolean
  transportCommune: string | null
  // Quién realiza el transporte: el hotel o JackCity. Ajusta el texto de la sección.
  transportBy?: "HOTEL" | "JACKCITY" | null
}

export async function createQuote(params: {
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
}): Promise<Quote> {
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
  return params.apiFetch("/api/quotes", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

// apiFetch agrega Authorization (bearer si hay sesión) + X-Visitor-Id / X-Session-Id.
export async function getQuote(quoteId: string, apiFetch: ApiFetch): Promise<Quote> {
  return apiFetch(`/api/quotes/${quoteId}`)
}
