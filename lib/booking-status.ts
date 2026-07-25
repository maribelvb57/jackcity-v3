import type { MyBookingStatus } from "@/lib/api/bookings"

const STATUS_LABELS: Record<MyBookingStatus, string> = {
  PENDING_PAYMENT: "Pendiente de Pago",
  PAID: "Pagada",
  CONFIRMED: "Confirmada",
  INITIATED: "Iniciada",
  PENDING_CANCELLATION: "Cancelación pendiente",
  COMPLETED: "Completada",
  CLOSED: "Cerrada",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No Show",
}

export function getBookingStatusLabel(status: MyBookingStatus): string {
  return STATUS_LABELS[status] ?? status
}
