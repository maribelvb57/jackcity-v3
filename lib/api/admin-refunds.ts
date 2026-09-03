import type { ApiFetch } from "@/hooks/use-api-client"

// Reservas pendientes de anulación (cola de trabajo del admin).
// GET /api/admin/bookingsToRefund — requiere rol ADMIN.

export interface BookingToRefundHotel {
  id: string
  name: string
  commune: string | null
}

export interface BookingToRefundCustomer {
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
}

export interface BookingToRefundPricing {
  totalPrice: number
  advanceAmount: number
  pendingAmount: number
  // Lo efectivamente cobrado (la señal). Es el techo de la anulación.
  paidAmount: number
}

export interface BookingToRefundCancellation {
  requestedAt: string
  reason: string | null
  policy: string | null
}

export interface BookingToRefundPayment {
  paymentId: string
  buyOrder: string | null
  amount: number
  paymentTypeCode: string | null
  // false en débito (VD) y prepago (VP): Transbank sólo acepta anulación total.
  allowsPartialRefund: boolean
  // false si el pago no tiene token guardado: no se puede anular por este medio.
  refundable: boolean
  paidAt: string | null
}

export interface BookingToRefund {
  bookingId: string
  number: string
  status: string
  hotel: BookingToRefundHotel
  customer: BookingToRefundCustomer
  checkinDate: string
  checkoutDate: string
  nightsCount: number | null
  petsCount: number | null
  pricing: BookingToRefundPricing
  cancellation: BookingToRefundCancellation
  // null cuando la reserva no alcanzó a pagarse: no hay nada que devolver.
  payment: BookingToRefundPayment | null
  createdAt: string
}

export interface BookingsToRefundResponse {
  count: number
  bookings: BookingToRefund[]
}

export async function getBookingsToRefund(apiFetch: ApiFetch): Promise<BookingsToRefundResponse> {
  return apiFetch<BookingsToRefundResponse>("/api/admin/bookingsToRefund")
}

// ─── Crear anulación ──────────────────────────────────────────────────────────
// POST /api/admin/refunds — requiere rol ADMIN.

export type RefundType = "TOTAL" | "PARCIAL"

export interface CreateRefundRequest {
  paymentId: string
  bookingId: string
  // Entero positivo. En TOTAL debe ser exactamente el monto pagado;
  // en PARCIAL debe ser menor.
  amount: number
  refundType: RefundType
}

export type RefundStatus = "PENDING" | "SUCCESS" | "FAILED" | "REJECTED"

/**
 * Resultado de la anulación. Llega con HTTP 200 tanto en éxito como cuando Transbank
 * rechaza o falla: en esos casos `success` viene en false y `message` trae el texto
 * accionable para el operador.
 */
export interface RefundResult {
  success: boolean
  refundId: number | null
  status: RefundStatus
  refundType: RefundType
  requestedAmount: number | null
  // Datos crudos de Transbank. En transbankType REVERSED los campos financieros
  // vienen en null porque Transbank no los envía.
  transbankType: string | null
  responseCode: number | null
  nullifiedAmount: number | null
  balance: number | null
  authorizationCode: string | null
  authorizationDate: string | null
  message: string | null
}

export async function createRefund(
  body: CreateRefundRequest,
  apiFetch: ApiFetch
): Promise<RefundResult> {
  return apiFetch<RefundResult>("/api/admin/refunds", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
