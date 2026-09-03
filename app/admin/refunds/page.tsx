"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Hourglass,
  MapPin,
  PawPrint,
  RotateCcw,
  ShieldAlert,
  User,
  X,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { useApiClient } from "@/hooks/use-api-client"
import { ApiError } from "@/lib/api/types"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { formatClp } from "@/lib/format"
import {
  createRefund,
  getBookingsToRefund,
  type BookingToRefund,
  type RefundResult,
  type RefundStatus,
  type RefundType,
} from "@/lib/api/admin-refunds"

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Códigos de tipo de pago de Transbank. Un código que no esté en la lista NO se
// asume crédito: se muestra crudo, porque en esta pantalla afirmar el medio de pago
// sin respaldo es peor que mostrar el código.
const PAYMENT_TYPE_LABEL: Record<string, string> = {
  VD: "Tarjeta Débito",
  VP: "Tarjeta Prepago",
  VN: "Tarjeta de Crédito",
  VC: "Tarjeta de Crédito",
  SI: "Tarjeta de Crédito",
  S2: "Tarjeta de Crédito",
  NC: "Tarjeta de Crédito",
  CI: "Tarjeta de Crédito",
}

function paymentTypeLabel(code: string | null) {
  if (!code) return "—"
  return PAYMENT_TYPE_LABEL[code] ?? `paymentTypeCode: ${code}`
}

// checkin/checkout vienen como fecha sin hora (LocalDate): se fija mediodía para
// que el cambio de zona horaria no corra el día.
function formatDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: es })
}

// requestedAt / paidAt vienen como instante ISO con zona.
function formatDateTime(instant: string) {
  return format(new Date(instant), "d MMM yyyy · HH:mm", { locale: es })
}

const POLICY_LABEL: Record<string, string> = {
  CANCELLATION_POLICY_FLEXIBLE: "Flexible",
  CANCELLATION_POLICY_STRICT: "Estricta",
}

function policyLabel(policy: string | null) {
  if (!policy) return "—"
  return POLICY_LABEL[policy] ?? policy
}

function customerFullName(customer: BookingToRefund["customer"]) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
}

function nightsLabel(booking: BookingToRefund) {
  const nights = booking.nightsCount ?? null
  if (nights == null) return null
  return `${nights} noche${nights === 1 ? "" : "s"}`
}

function petsLabel(petsCount: number | null) {
  if (petsCount == null) return "—"
  return `${petsCount} mascota${petsCount === 1 ? "" : "s"}`
}

// ─── Anulación ────────────────────────────────────────────────────────────────

// El backend valida de nuevo todo esto, pero sólo devuelve su texto en dev/beta
// (en prod `include-message: never`), así que la pantalla arma su propio mensaje
// por status y usa el del backend cuando viene.
const REFUND_ERROR_BY_STATUS: Record<number, string> = {
  400: "El monto no es válido para el tipo de anulación elegido.",
  403: "No tienes permisos de administrador para anular.",
  404: "No se encontró el pago o la reserva.",
  409: "El pago no se puede anular: ya hay una anulación en curso o aprobada, o el pago no está aprobado.",
  422: "Transbank no permite anulaciones parciales sobre este medio de pago. Usa anulación total.",
}

function refundErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail ?? REFUND_ERROR_BY_STATUS[error.status] ?? "No se pudo procesar la anulación."
  }
  return "No se pudo procesar la anulación. Intenta nuevamente."
}

function ConfirmRefundModal({
  booking,
  refundType,
  amount,
  isPending,
  onConfirm,
  onCancel,
}: {
  booking: BookingToRefund
  refundType: RefundType
  amount: number
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <span className="text-lg font-bold text-white">Confirmar anulación</span>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="text-white transition-opacity hover:opacity-70 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm font-medium leading-6" style={{ color: "#526071" }}>
            Se enviará la anulación a Transbank. Esta acción no se puede deshacer.
          </p>
          <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Reserva</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>
              {customerFullName(booking.customer)} · {booking.hotel.name}
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold" style={{ color: "#8A94A6" }}>#{booking.number}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
              Anulación {refundType === "TOTAL" ? "total" : "parcial"}
            </p>
            <p className="mt-1 text-lg font-bold" style={{ color: "#0A1830" }}>{formatClp(amount)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border px-5 py-2 text-sm font-bold transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#526071" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg px-5 py-2 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            {isPending ? "Procesando..." : "Sí, hacer refund"}
          </button>
        </div>
      </div>
    </div>
  )
}

const REFUND_STATUS_META: Record<RefundStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pendiente", color: "#8A6D1C", bg: "#FEF3C7" },
  SUCCESS: { label: "Aprobada", color: "#08785B", bg: "#EAF8F3" },
  REJECTED: { label: "Rechazada", color: "#9B1C1C", bg: "#FDE8E8" },
  FAILED: { label: "Fallida", color: "#9B1C1C", bg: "#FDE8E8" },
}

// Glosa de los dos tipos que devuelve Transbank. En REVERSED la transacción aún no
// se cursaba, por eso llegan en null los campos financieros.
const TRANSBANK_TYPE_NOTE: Record<string, string> = {
  REVERSED: "Reversa: la transacción aún no se cursaba, no se generó cargo.",
  NULLIFIED: "Anulación de una transacción ya cursada.",
}

// Modal con el detalle crudo de lo que respondió el backend/Transbank. Se muestran
// todos los campos, incluidos los que vienen en null, porque ese null también es dato.
function RefundResultModal({
  result,
  errorMessage,
  onClose,
}: {
  result: RefundResult | null
  errorMessage: string | null
  onClose: () => void
}) {
  const meta = result ? REFUND_STATUS_META[result.status] ?? REFUND_STATUS_META.FAILED : null
  const ok = result?.success === true

  const rows: Array<{ label: string; value: string; mono?: boolean }> = result
    ? [
        { label: "Resultado", value: result.success ? "Éxito" : "Sin éxito" },
        { label: "Refund ID", value: result.refundId != null ? String(result.refundId) : "—", mono: true },
        { label: "Estado", value: result.status },
        { label: "Tipo", value: result.refundType === "TOTAL" ? "Total" : "Parcial" },
        {
          label: "Monto solicitado",
          value: result.requestedAmount != null ? formatClp(result.requestedAmount) : "—",
        },
        { label: "Tipo Transbank", value: result.transbankType ?? "—" },
        { label: "Código de respuesta", value: result.responseCode != null ? String(result.responseCode) : "—", mono: true },
        {
          label: "Monto anulado",
          value: result.nullifiedAmount != null ? formatClp(result.nullifiedAmount) : "—",
        },
        { label: "Saldo", value: result.balance != null ? formatClp(result.balance) : "—" },
        { label: "Cód. autorización", value: result.authorizationCode ?? "—", mono: true },
        {
          label: "Fecha autorización",
          value: result.authorizationDate ? formatDateTime(result.authorizationDate) : "—",
        },
      ]
    : []

  const transbankNote = result?.transbankType ? TRANSBANK_TYPE_NOTE[result.transbankType] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <div className="flex items-center gap-2">
            {ok ? (
              <CheckCircle2 size={18} style={{ color: "#7BE3B4" }} />
            ) : (
              <ShieldAlert size={18} style={{ color: "#FFC43D" }} />
            )}
            <span className="text-lg font-bold text-white">
              {result ? (ok ? "Anulación procesada" : "Anulación no completada") : "No se pudo anular"}
            </span>
          </div>
          <button onClick={onClose} className="text-white transition-opacity hover:opacity-70" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "65vh" }}>
          {result ? (
            <>
              {meta && (
                <span
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              )}

              {result.message && (
                <p
                  className="mt-3 rounded-md px-3 py-2 text-sm font-medium leading-6"
                  style={
                    ok
                      ? { backgroundColor: "#EAF8F3", color: "#08785B" }
                      : { backgroundColor: "#FDE8E8", color: "#9B1C1C" }
                  }
                >
                  {result.message}
                </p>
              )}

              <div className="mt-4 space-y-2.5">
                {rows.map(({ label, value, mono }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                      {label}
                    </span>
                    <span
                      className={`text-right text-sm font-semibold ${mono ? "font-mono" : ""}`}
                      style={{ color: value === "—" ? "#9CA3AF" : "#0A1830" }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {transbankNote && (
                <p className="mt-3 text-xs font-medium leading-5" style={{ color: "#8A94A6" }}>
                  {transbankNote}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium leading-6" style={{ color: "#9B1C1C" }}>
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t px-5 py-3" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function RefundPanel({ booking }: { booking: BookingToRefund }) {
  const payment = booking.payment
  const { apiFetch } = useApiClient()

  const [refundType, setRefundType] = useState<RefundType>("TOTAL")
  const [partialAmount, setPartialAmount] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<RefundResult | null>(null)
  // Modal con el detalle de la respuesta. Se abre tanto con el RefundDto como
  // cuando la llamada falló antes de llegar a Transbank.
  const [resultOpen, setResultOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (amount: number) =>
      createRefund(
        {
          paymentId: payment!.paymentId,
          bookingId: booking.bookingId,
          amount,
          refundType,
        },
        apiFetch
      ),
    onSuccess: (data) => {
      setResult(data)
      setConfirmOpen(false)
      setResultOpen(true)
      // A propósito NO se invalida el listado: al refrescarlo, el backend ya no
      // devuelve esta reserva (queda con un refund PENDING/SUCCESS), la card se
      // desmonta y se lleva puesto el modal con la respuesta. La reserva se queda
      // en pantalla hasta que el operador recargue la página a mano.
    },
    onError: () => {
      setConfirmOpen(false)
      setResultOpen(true)
    },
  })

  if (!payment) {
    return (
      <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
          <RotateCcw size={13} />
          Hacer refund
        </p>
        <p className="text-sm font-medium leading-6" style={{ color: "#526071" }}>
          La reserva no tiene un pago registrado: no hay nada que anular.
        </p>
      </div>
    )
  }

  const canPartial = payment.allowsPartialRefund
  const paidAmount = payment.amount

  // El monto de una anulación TOTAL lo fija el pago: el backend exige que sea exacto.
  const parsedPartial = partialAmount.trim() === "" ? null : Number(partialAmount)
  const amount = refundType === "TOTAL" ? paidAmount : parsedPartial

  const partialError =
    refundType === "PARCIAL" && parsedPartial != null
      ? !Number.isInteger(parsedPartial) || parsedPartial <= 0
        ? "Ingresa un monto entero mayor a 0."
        : parsedPartial >= paidAmount
          ? `El monto parcial debe ser menor a lo pagado (${formatClp(paidAmount)}).`
          : null
      : null

  const canSubmit =
    payment.refundable && amount != null && amount > 0 && !partialError && !mutation.isPending

  const selectRefundType = (value: RefundType) => {
    setRefundType(value)
    setResult(null)
    mutation.reset()
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
        <RotateCcw size={13} />
        Hacer refund
      </p>

      {!payment.refundable && (
        <p
          className="mb-3 flex items-start gap-1.5 rounded-md px-3 py-2 text-xs font-semibold leading-5"
          style={{ backgroundColor: "#FDE8E8", color: "#9B1C1C" }}
        >
          <ShieldAlert size={13} className="mt-0.5 flex-shrink-0" />
          El pago no tiene token de Transbank: hay que resolverlo manualmente en el portal.
        </p>
      )}

      {/* Tipo de anulación */}
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={`refund-type-${booking.bookingId}`}
            value="TOTAL"
            checked={refundType === "TOTAL"}
            onChange={() => selectRefundType("TOTAL")}
            disabled={!payment.refundable}
            className="h-4 w-4"
            style={{ accentColor: "#0D2B45" }}
          />
          <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Total</span>
        </label>

        <label
          className={`flex items-center gap-2 ${canPartial && payment.refundable ? "cursor-pointer" : "cursor-not-allowed"}`}
          title={canPartial ? undefined : "Transbank no permite anulaciones parciales en débito ni prepago."}
        >
          <input
            type="radio"
            name={`refund-type-${booking.bookingId}`}
            value="PARCIAL"
            checked={refundType === "PARCIAL"}
            onChange={() => selectRefundType("PARCIAL")}
            disabled={!canPartial || !payment.refundable}
            className="h-4 w-4"
            style={{ accentColor: "#0D2B45" }}
          />
          <span className="text-sm font-bold" style={{ color: canPartial ? "#0A1830" : "#9CA3AF" }}>
            Parcial
          </span>
        </label>
      </div>

      {refundType === "TOTAL" ? (
        <p className="mt-3 text-sm font-semibold" style={{ color: "#526071" }}>
          Se anulará el total pagado: <span className="font-bold" style={{ color: "#0A1830" }}>{formatClp(paidAmount)}</span>
        </p>
      ) : (
        <div className="mt-3">
          <label
            htmlFor={`refund-amount-${booking.bookingId}`}
            className="text-xs font-bold uppercase tracking-[0.12em]"
            style={{ color: "#8A94A6" }}
          >
            Monto a devolver
          </label>
          <input
            id={`refund-amount-${booking.bookingId}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={paidAmount - 1}
            step={1}
            value={partialAmount}
            onChange={(e) => {
              setPartialAmount(e.target.value)
              setResult(null)
              mutation.reset()
            }}
            disabled={!payment.refundable}
            placeholder="0"
            className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm font-bold outline-none focus:border-[#0D2B45] disabled:opacity-50"
            style={{ borderColor: partialError ? "#F5C6C6" : "#E5E7EB", color: "#0A1830" }}
          />
          <p className="mt-1 text-xs font-semibold" style={{ color: partialError ? "#9B1C1C" : "#8A94A6" }}>
            {partialError ?? `Debe ser menor a ${formatClp(paidAmount)}`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={!canSubmit}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
      >
        <RotateCcw size={14} />
        {mutation.isPending ? "Procesando..." : "Hacer refund"}
      </button>

      {mutation.isError && (
        <p className="mt-3 text-xs font-semibold leading-5" style={{ color: "#9B1C1C" }}>
          {refundErrorMessage(mutation.error)}
        </p>
      )}

      {/* Transbank puede rechazar con HTTP 200: el resultado va en success/message. */}
      {result && (
        <p
          className="mt-3 flex items-start gap-1.5 rounded-md px-3 py-2 text-xs font-semibold leading-5"
          style={
            result.success
              ? { backgroundColor: "#EAF8F3", color: "#08785B" }
              : { backgroundColor: "#FDE8E8", color: "#9B1C1C" }
          }
        >
          {result.success ? (
            <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldAlert size={13} className="mt-0.5 flex-shrink-0" />
          )}
          {result.message ??
            (result.success ? "Anulación procesada." : "Transbank rechazó la anulación.")}
        </p>
      )}

      {result && !resultOpen && (
        <button
          type="button"
          onClick={() => setResultOpen(true)}
          className="mt-2 text-xs font-bold underline transition-opacity hover:opacity-70"
          style={{ color: "#0D2B45" }}
        >
          Ver detalle de la respuesta
        </button>
      )}

      {resultOpen && (
        <RefundResultModal
          result={result}
          errorMessage={mutation.isError ? refundErrorMessage(mutation.error) : null}
          onClose={() => setResultOpen(false)}
        />
      )}

      {confirmOpen && amount != null && (
        <ConfirmRefundModal
          booking={booking}
          refundType={refundType}
          amount={amount}
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate(amount)}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function RefundCard({ booking }: { booking: BookingToRefund }) {
  const nights = nightsLabel(booking)
  const payment = booking.payment

  return (
    <article className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: "#E5E7EB" }}>
      <div className="p-5 sm:p-6">
        {/* Cabecera: estado + cliente + mascotas + número de reserva */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: "#FFF7ED", color: "#9A3412" }}
            >
              <Hourglass size={13} />
              Cancelación pendiente
            </span>
            <div className="flex items-center gap-1.5">
              <User size={15} style={{ color: "#8A94A6" }} />
              <span className="text-sm font-bold" style={{ color: "#0A1830" }}>
                {customerFullName(booking.customer)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PawPrint size={14} style={{ color: "#2E7D32" }} />
              <span className="text-sm font-medium" style={{ color: "#526071" }}>
                {petsLabel(booking.petsCount)}
              </span>
            </div>
          </div>
          <span
            className="rounded border px-2 py-0.5 font-mono text-xs font-bold"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC", color: "#8A94A6" }}
          >
            #{booking.number}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Hotel */}
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
              <Building2 size={13} />
              Hotel
            </p>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{booking.hotel.name}</p>
            {booking.hotel.commune && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold" style={{ color: "#667085" }}>
                <MapPin size={12} />
                {booking.hotel.commune}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
              <CalendarDays size={13} />
              Fechas
            </p>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
              {formatDate(booking.checkinDate)} – {formatDate(booking.checkoutDate)}
            </p>
            {nights && (
              <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>{nights}</p>
            )}
          </div>

          {/* Montos */}
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
              <CreditCard size={13} />
              Montos
            </p>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
              {formatClp(booking.pricing.paidAmount)} pagado
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>
              Total {formatClp(booking.pricing.totalPrice)}
            </p>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: "#667085" }}>
              Señal {formatClp(booking.pricing.advanceAmount)} · Pendiente {formatClp(booking.pricing.pendingAmount)}
            </p>
          </div>

          {/* Pago a anular */}
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
              <RotateCcw size={13} />
              Pago a anular
            </p>
            {payment ? (
              <>
                <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{formatClp(payment.amount)}</p>
                <p className="mt-1 text-xs font-semibold" style={{ color: "#526071" }}>
                  {paymentTypeLabel(payment.paymentTypeCode)}
                </p>
                {payment.buyOrder && (
                  <p className="mt-0.5 font-mono text-xs" style={{ color: "#8A94A6" }}>{payment.buyOrder}</p>
                )}
                {payment.paidAt && (
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: "#667085" }}>
                    Pagado el {formatDateTime(payment.paidAt)}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {!payment.refundable && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: "#FDE8E8", color: "#9B1C1C" }}
                    >
                      <ShieldAlert size={11} />
                      No anulable
                    </span>
                  )}
                  {!payment.allowsPartialRefund && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: "#FEF3C7", color: "#8A6D1C" }}
                    >
                      Sólo anulación total
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm font-bold" style={{ color: "#8A94A6" }}>Sin pago registrado</p>
            )}
          </div>
        </div>

        {/* Solicitud de cancelación + acción de anulación */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>Solicitada</p>
                <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>
                  {formatDateTime(booking.cancellation.requestedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>Política</p>
                <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>
                  {policyLabel(booking.cancellation.policy)}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>Motivo</p>
              <p
                className="mt-1 text-sm font-medium leading-6"
                style={{ color: booking.cancellation.reason ? "#0A1830" : "#9CA3AF" }}
              >
                {booking.cancellation.reason || "Sin motivo indicado."}
              </p>
            </div>
          </div>

          <RefundPanel booking={booking} />
        </div>

        {/* Contacto */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-4" style={{ borderColor: "#EEF2F7" }}>
          <span className="text-xs font-semibold" style={{ color: "#8A94A6" }}>Contacto:</span>
          {booking.customer.email && (
            <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.email}</span>
          )}
          {booking.customer.phone && (
            <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.phone}</span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminRefundsContent() {
  const { apiFetch } = useApiClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-bookings-to-refund"],
    queryFn: () => getBookingsToRefund(apiFetch),
  })

  // Cola de trabajo: primero la solicitud más antigua.
  const bookings = useMemo(() => {
    const list = data?.bookings ?? []
    return [...list].sort(
      (a, b) => new Date(a.cancellation.requestedAt).getTime() - new Date(b.cancellation.requestedAt).getTime()
    )
  }, [data])

  const count = data?.count ?? bookings.length

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="grid gap-5 border-b pb-6 lg:grid-cols-[1fr_220px] lg:items-end" style={{ borderColor: "#E5E7EB" }}>
          <div>
            <p
              className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ borderColor: "#E5E7EB", color: "#2E7D32" }}
            >
              <PawPrint size={15} />
              Panel Admin
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#0A1830" }}>
              Anulaciones
            </h1>
            <p className="mt-3 max-w-[620px] text-base font-medium leading-7" style={{ color: "#526071" }}>
              Reservas que solicitaron cancelación y siguen pendientes de anulación.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-2" style={{ borderColor: "#E5E7EB" }}>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#9A3412" }}>{count}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Pendientes por cancelar</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-5 grid gap-5">
          {isLoading && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Cargando anulaciones...</p>
            </div>
          )}

          {isError && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#F3D1D1" }}>
              <p className="text-sm font-bold" style={{ color: "#8A1C1C" }}>No pudimos cargar las anulaciones</p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>Intenta nuevamente en unos segundos.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 min-h-10 rounded-full px-5 text-sm font-bold"
                style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && bookings.length === 0 && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border"
                style={{ borderColor: "#E5E7EB", color: "#8A94A6" }}
              >
                <RotateCcw size={28} />
              </div>
              <p className="mt-4 text-sm font-bold" style={{ color: "#0A1830" }}>No hay anulaciones pendientes</p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>
                Cuando una reserva solicite cancelación, aparecerá aquí.
              </p>
            </div>
          )}

          {!isLoading && !isError && bookings.map((booking) => (
            <RefundCard key={booking.bookingId} booking={booking} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AdminRefundsPage() {
  const { isLoaded, isSignedIn } = useRequireAuth()

  // Sin sesión no se renderiza nada ni se dispara la llamada al API:
  // useRequireAuth ya está redirigiendo al sign-in.
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#F6F7F9" }}>
        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
          {isLoaded ? "Redirigiendo al inicio de sesión..." : "Cargando..."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#F6F7F9" }}>
      <SiteNavbar />
      <main className="min-w-0 flex-1">
        <AdminRefundsContent />
      </main>
    </div>
  )
}
