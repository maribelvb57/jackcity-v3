import type { ApiFetch } from "@/lib/api/types"

export type HotelSettingsDto = {
  hotelId: string
  status: "ACTIVE" | "PAUSED"
  offersTransport: boolean
}

// apiFetch (useApiClient) ya antepone API_BASE, agrega headers, parsea el JSON y
// lanza si la respuesta no es ok — por eso acá se usa path relativo y se retorna directo.

export async function updateHotelStatus(
  hotelId: string,
  status: "ACTIVE" | "PAUSED",
  apiFetch: ApiFetch
): Promise<HotelSettingsDto> {
  return apiFetch<HotelSettingsDto>(`/api/hotel/settings/${hotelId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function updateHotelTransport(
  hotelId: string,
  offersTransport: boolean,
  apiFetch: ApiFetch
): Promise<HotelSettingsDto> {
  return apiFetch<HotelSettingsDto>(`/api/hotel/settings/${hotelId}/transport`, {
    method: "PATCH",
    body: JSON.stringify({ offersTransport }),
  })
}

export async function updateHotelPricing(
  hotelId: string,
  size: string,
  pricePerNight: number,
  apiFetch: ApiFetch
): Promise<void> {
  await apiFetch<void>(
    `/api/hotels/${hotelId}/pricing/${size}/${pricePerNight}`,
    { method: "PUT" }
  )
}

export type HotelDiscountRule = {
  minNights: number
  label: string
  discountPct: number
}

// Fuente de verdad de los descuentos editables: expone minNights, que es lo que
// identifica la regla en el PUT de abajo. GET /api/hotel/info trae los descuentos
// como Record<label, pct> (sin minNights) y se sigue usando solo para lectura.
export async function getHotelDiscounts(
  hotelId: string,
  apiFetch: ApiFetch
): Promise<HotelDiscountRule[]> {
  return apiFetch<HotelDiscountRule[]>(`/api/hotel/discounts/${hotelId}`)
}

export async function updateHotelDiscountRule(
  hotelId: string,
  minNights: number,
  discountPct: number,
  apiFetch: ApiFetch
): Promise<void> {
  await apiFetch<void>(
    `/api/hotels/${hotelId}/discount-rules/${minNights}/${discountPct}`,
    { method: "PUT" }
  )
}
