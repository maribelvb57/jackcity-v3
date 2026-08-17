import type { ApiFetch } from "@/lib/api/types"

// Días cerrados: fechas en las que el hotel no acepta check-in ni check-out.
// No afectan a las estadías en curso.
//
// apiFetch (useApiClient) ya antepone API_BASE, agrega headers, parsea el JSON y
// lanza si la respuesta no es ok — por eso acá se usa path relativo y se retorna directo.

/** Fechas "yyyy-MM-dd" en orden ascendente. */
export async function getHotelHolidays(
  hotelId: string,
  apiFetch: ApiFetch
): Promise<string[]> {
  return apiFetch<string[]>(`/api/hotel/holidays/${hotelId}`)
}

/** Días ISO de la semana (1 = lunes … 7 = domingo) en orden ascendente. */
export async function getHotelNoWorkingDays(
  hotelId: string,
  apiFetch: ApiFetch
): Promise<number[]> {
  return apiFetch<number[]>(`/api/hotel/noworkingdays/${hotelId}`)
}
