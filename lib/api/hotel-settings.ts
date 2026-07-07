import { API_BASE } from "./config"

export type HotelSettingsDto = {
  hotelId: string
  status: "ACTIVE" | "PAUSED"
  offersTransport: boolean
}

type ApiFetch = (path: string, init?: RequestInit) => Promise<Response>

export async function updateHotelStatus(
  hotelId: string,
  status: "ACTIVE" | "PAUSED",
  apiFetch: ApiFetch
): Promise<HotelSettingsDto> {
  const res = await apiFetch(`${API_BASE}/api/hotel/settings/${hotelId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(`updateHotelStatus failed: ${res.status}`)
  return res.json()
}

export async function updateHotelPricing(
  hotelId: string,
  size: string,
  pricePerNight: number,
  apiFetch: ApiFetch
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/hotels/${hotelId}/pricing/${size}/${pricePerNight}`,
    { method: "PUT" }
  )
  if (!res.ok) throw new Error(`updateHotelPricing failed: ${res.status}`)
}

// minNights pendiente: GET /api/hotel/info debe exponer minNights por regla de descuento
export async function updateHotelDiscountRule(
  hotelId: string,
  minNights: number,
  discountPct: number,
  apiFetch: ApiFetch
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/hotels/${hotelId}/discount-rules/${minNights}/${discountPct}`,
    { method: "PUT" }
  )
  if (!res.ok) throw new Error(`updateHotelDiscountRule failed: ${res.status}`)
}

export async function updateHotelTransport(
  hotelId: string,
  offersTransport: boolean,
  apiFetch: ApiFetch
): Promise<HotelSettingsDto> {
  const res = await apiFetch(`${API_BASE}/api/hotel/settings/${hotelId}/transport`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offersTransport }),
  })
  if (!res.ok) throw new Error(`updateHotelTransport failed: ${res.status}`)
  return res.json()
}
