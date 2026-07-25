import type { ApiFetch } from "@/lib/api/types"

// Cada review evalúa una sección de la reserva: alojamiento o transporte.
// Un booking con transporte genera dos reviews (dos llamados a este endpoint).
export type ReviewType = "HOUSING" | "TRANSPORT"

// Guarda la evaluación de una reserva desde /mis-reservas.
// goodThings / badThings son opcionales y hoy solo se envían en la review HOUSING.
export type CreateReviewParams = {
  bookingId: string
  type: ReviewType
  stars: number
  goodThings?: string
  badThings?: string
}

// La respuesta devuelve el id de la review creada (asumido campo `id`; confirmar con Maribel).
export type CreateReviewResult = {
  id: string
}

export async function createReview(params: CreateReviewParams, apiFetch: ApiFetch): Promise<CreateReviewResult> {
  return apiFetch("/api/reviews", {
    method: "POST",
    body: JSON.stringify(params),
  })
}
