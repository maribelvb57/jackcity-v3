"use client"

import { use, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  PawPrint,
  ShieldCheck,
  Star,
  Car,
  User,
  CreditCard,
  Info,
  X,
  LogIn,
  LogOut,
  Ban,
  Lock,
  Hourglass,
} from "lucide-react"
import { ManagerLayout } from "@/components/manager-layout"
import { useApiClient } from "@/hooks/use-api-client"
import { formatClp } from "@/lib/format"
import { getHotelBookings, confirmHotelBooking, checkInHotelBooking, checkOutHotelBooking, markNoShowHotelBooking, type HotelBooking, type HotelBookingStatus, type TransportSlot, type BookingPet } from "@/lib/api/hotel-bookings"
import { getBookingStatusLabel } from "@/lib/booking-status"

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Agrupaciones de estados (según definición de negocio):
//   Vigentes:    PAID, CONFIRMED, INITIATED
//   Completadas: COMPLETED, CLOSED, NO_SHOW
//   Otras:       PENDING_PAYMENT, EXPIRED, CANCELLED
type BookingGroup = "VIGENTES" | "COMPLETADAS" | "OTRAS"

const GROUP_STATUSES: Record<BookingGroup, HotelBookingStatus[]> = {
  VIGENTES: ["PAID", "CONFIRMED", "INITIATED"],
  COMPLETADAS: ["COMPLETED", "CLOSED", "NO_SHOW"],
  OTRAS: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"],
}

function bookingGroup(status: HotelBookingStatus): BookingGroup {
  if (GROUP_STATUSES.VIGENTES.includes(status)) return "VIGENTES"
  if (GROUP_STATUSES.COMPLETADAS.includes(status)) return "COMPLETADAS"
  return "OTRAS"
}

// Acciones disponibles por estado. Aún sin cablear al backend: los endpoints/contratos
// los define Maribel en un paso posterior (ver resumen).
type BookingActionKey = "confirm" | "checkin" | "checkout" | "no_show"

interface BookingAction {
  key: BookingActionKey
  label: string
  variant: "primary" | "danger"
}

const ACTION_CONFIRM: Record<BookingActionKey, { title: string; description: string; confirmLabel: string; danger: boolean }> = {
  confirm: {
    title: "Confirmar reserva",
    description: "La reserva pasará a estado Confirmada y el cliente será notificado.",
    confirmLabel: "Sí, confirmar",
    danger: false,
  },
  checkin: {
    title: "Registrar check-in",
    description: "Se marcará que la mascota ingresó al hotel.",
    confirmLabel: "Sí, hacer check-in",
    danger: false,
  },
  checkout: {
    title: "Registrar check-out",
    description: "La reserva se marcará como completada y la mascota dejó el hotel.",
    confirmLabel: "Sí, hacer check-out",
    danger: false,
  },
  no_show: {
    title: "Marcar como No Show",
    description: "Se registrará que el cliente no se presentó al hotel. Esta acción no se puede deshacer.",
    confirmLabel: "Sí, marcar No Show",
    danger: true,
  },
}

const STATUS_ACTIONS: Record<HotelBookingStatus, BookingAction[]> = {
  PAID: [{ key: "confirm", label: "Confirmar Reserva", variant: "primary" }],
  CONFIRMED: [
    { key: "checkin", label: "Check-in", variant: "primary" },
    { key: "no_show", label: "No Show", variant: "danger" },
  ],
  INITIATED: [{ key: "checkout", label: "Check-out", variant: "primary" }],
  PENDING_PAYMENT: [],
  COMPLETED: [],
  CLOSED: [],
  EXPIRED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

function formatDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: es })
}

function nightsBetween(checkinDate: string, checkoutDate: string) {
  const checkin = new Date(`${checkinDate}T12:00:00`)
  const checkout = new Date(`${checkoutDate}T12:00:00`)
  return Math.max(1, Math.round((checkout.getTime() - checkin.getTime()) / 86400000))
}

const SLOT_LABEL: Record<TransportSlot, string> = { AM: "Mañana", MD: "Mediodía", PM: "Tarde" }

const SIZE_LABEL: Record<string, string> = {
  SMALL: "Pequeño", MEDIUM: "Mediano", LARGE: "Grande", EXTRA_LARGE: "Extra grande",
}
const GENDER_LABEL: Record<string, string> = { MALE: "Macho", FEMALE: "Hembra" }
const SPECIES_LABEL: Record<string, string> = { DOG: "Perro", CAT: "Gato" }

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months} mes${months === 1 ? "" : "es"}`
  const years = Math.floor(months / 12)
  return `${years} año${years === 1 ? "" : "s"}`
}

// ─── Pet Modal ────────────────────────────────────────────────────────────────

function PetModal({ pet, onClose }: { pet: BookingPet; onClose: () => void }) {
  const rows: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Nombre", value: pet.name },
    { label: "Especie", value: pet.species ? (SPECIES_LABEL[pet.species] ?? pet.species) : null },
    { label: "Raza", value: pet.breedName ?? (pet.breedId != null ? `ID ${pet.breedId}` : null) },
    { label: "Tamaño", value: pet.size ? (SIZE_LABEL[pet.size] ?? pet.size) : null },
    { label: "Género", value: pet.gender ? (GENDER_LABEL[pet.gender] ?? pet.gender) : null },
    { label: "Peso", value: pet.weight != null ? `${pet.weight} kg` : null },
    { label: "Edad", value: pet.birthDate ? calcAge(pet.birthDate) : null },
    { label: "Color", value: pet.color },
    { label: "Notas", value: pet.notes },
  ]

  const vaccineEntries = pet.vaccines ? Object.entries(pet.vaccines) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <div className="flex items-center gap-2">
            <PawPrint size={18} style={{ color: "#FFC43D" }} />
            <span className="text-lg font-bold text-white">{pet.name}</span>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-70 transition-opacity" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2.5 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {rows.map(({ label, value }) =>
            value ? (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wide flex-shrink-0" style={{ color: "#9CA3AF" }}>
                  {label}
                </span>
                <span className="text-sm font-semibold text-right" style={{ color: "#0A1830" }}>
                  {value}
                </span>
              </div>
            ) : null
          )}

          {vaccineEntries.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                Vacunas
              </span>
              <div className="mt-1.5 space-y-1">
                {vaccineEntries.map(([name, date]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize" style={{ color: "#526071" }}>{name}</span>
                    <span className="text-xs font-semibold" style={{ color: "#0A1830" }}>
                      {formatDate(date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Action Modal ───────────────────────────────────────────────────

function ConfirmActionModal({
  action,
  booking,
  isPending,
  onConfirm,
  onCancel,
}: {
  action: BookingActionKey
  booking: HotelBooking
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const meta = ACTION_CONFIRM[action]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <span className="text-lg font-bold text-white">{meta.title}</span>
          <button onClick={onCancel} disabled={isPending} className="text-white hover:opacity-70 transition-opacity disabled:opacity-50" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm font-medium leading-6" style={{ color: "#526071" }}>
            {meta.description}
          </p>
          <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Reserva</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>
              {customerFullName(booking.customer)} · {petNames(booking.pets)}
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold" style={{ color: "#8A94A6" }}>
              #{booking.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#526071" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: meta.danger ? "#9B1C1C" : "#FFC43D",
              color: meta.danger ? "#FFFFFF" : "#0D2B45",
            }}
          >
            {isPending ? "Procesando..." : meta.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function statusMeta(status: HotelBookingStatus) {
  switch (status) {
    case "PENDING_PAYMENT": return { color: "#9B1C1C", bg: "#FDE8E8", icon: Clock }
    case "PAID": return { color: "#125BD8", bg: "#EAF2FF", icon: ShieldCheck }
    case "CONFIRMED": return { color: "#08785B", bg: "#EAF8F3", icon: CheckCircle2 }
    case "INITIATED": return { color: "#4338CA", bg: "#EEF2FF", icon: LogIn }
    case "COMPLETED": return { color: "#0D2B45", bg: "#EAF2F8", icon: Star }
    case "CLOSED": return { color: "#526071", bg: "#F3F4F6", icon: Lock }
    case "EXPIRED": return { color: "#8A6D1C", bg: "#FEF3C7", icon: Hourglass }
    case "NO_SHOW": return { color: "#9A3412", bg: "#FFEDD5", icon: Ban }
    case "CANCELLED": return { color: "#526071", bg: "#F3F4F6", icon: X }
    default: return { color: "#526071", bg: "#F3F4F6", icon: Clock }
  }
}

function customerFullName(customer: HotelBooking["customer"]) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
}

function petNames(pets: HotelBooking["pets"]) {
  const names = pets.map((p) => p.name).filter(Boolean)
  if (names.length === 0) return "Sin mascotas"
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

const ACTION_ICON: Record<BookingActionKey, typeof LogIn> = {
  confirm: CheckCircle2,
  checkin: LogIn,
  checkout: LogOut,
  no_show: Ban,
}

function BookingCard({
  booking,
  onAction,
  actionPending = false,
  actionError = false,
}: {
  booking: HotelBooking
  onAction: (booking: HotelBooking, action: BookingActionKey) => void
  actionPending?: boolean
  actionError?: boolean
}) {
  const meta = statusMeta(booking.status)
  const StatusIcon = meta.icon
  const nights = nightsBetween(booking.checkinDate, booking.checkoutDate)
  const [selectedPet, setSelectedPet] = useState<BookingPet | null>(null)
  const actions = STATUS_ACTIONS[booking.status]

  return (
    <article
      className="overflow-hidden rounded-lg border bg-white shadow-sm"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="p-5 sm:p-6">
        {/* Top row: status + customer + booking id */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              <StatusIcon size={13} />
              {getBookingStatusLabel(booking.status)}
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
                {petNames(booking.pets)}
              </span>
            </div>
          </div>
          <span
            className="rounded border px-2 py-0.5 font-mono text-xs font-bold"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC", color: "#8A94A6" }}
          >
            #{booking.id.slice(0, 8)}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#8A94A6" }}>
              <CalendarDays size={13} />
              Fechas
            </p>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
              {formatDate(booking.checkinDate)} – {formatDate(booking.checkoutDate)}
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>
              {nights} noche{nights === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#8A94A6" }}>
              <CreditCard size={13} />
              Precios
            </p>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
              {formatClp(booking.pricing.paidPrice)} pagado
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>
              Total {formatClp(booking.pricing.totalPrice)}
            </p>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#8A94A6" }}>
              <Car size={13} />
              Transporte
            </p>
            {booking.transport.included ? (
              <>
                <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Incluido</p>
                {booking.transport.pickupCommune && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: "#526071" }}>
                    Recogida: {booking.transport.pickupCommune}
                  </p>
                )}
                {booking.transport.departure && (
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: "#526071" }}>
                    Ida: {formatDate(booking.transport.departure.date)} · {SLOT_LABEL[booking.transport.departure.slot]}
                  </p>
                )}
                {booking.transport.return && (
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: "#526071" }}>
                    Vuelta: {formatDate(booking.transport.return.date)} · {SLOT_LABEL[booking.transport.return.slot]}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-bold" style={{ color: "#8A94A6" }}>No incluido</p>
            )}
          </div>

          {/* Mascotas */}
          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "#8A94A6" }}>
              <PawPrint size={13} />
              Mascotas
            </p>
            <div className="space-y-2.5">
              {booking.pets.map((pet) => (
                <div key={pet.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{pet.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#526071" }}>
                      {[
                        pet.size ? SIZE_LABEL[pet.size] : null,
                        pet.gender ? GENDER_LABEL[pet.gender] : null,
                        pet.birthDate ? calcAge(pet.birthDate) : null,
                      ].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {(pet.breedName ?? pet.breedId) && (
                      <p className="text-xs mt-0.5" style={{ color: "#8A94A6" }}>
                        {pet.breedName ?? `Raza ID ${pet.breedId}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPet(pet)}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Ver ficha completa"
                    aria-label={`Ver ficha de ${pet.name}`}
                  >
                    <Info size={16} style={{ color: "#1a3a5c" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: contact + actions */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4" style={{ borderColor: "#EEF2F7" }}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold" style={{ color: "#8A94A6" }}>Contacto:</span>
            <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.email}</span>
            {booking.customer.phone && (
              <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.phone}</span>
            )}
          </div>

          {actions.length > 0 && (
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {actions.map((action) => {
                  const ActionIcon = ACTION_ICON[action.key]
                  const isDanger = action.variant === "danger"
                  const isConfirm = action.key === "confirm"
                  const isYellow = action.key === "confirm" || action.key === "checkin"
                  return (
                    <button
                      key={action.key}
                      type="button"
                      disabled={actionPending}
                      onClick={() => onAction(booking, action.key)}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isDanger ? "#FDE8E8" : isYellow ? "#FFC43D" : "#0D2B45",
                        color: isDanger ? "#9B1C1C" : isYellow ? "#0D2B45" : "#FFFFFF",
                        border: isDanger ? "1px solid #F5C6C6" : "none",
                      }}
                    >
                      <ActionIcon size={14} />
                      {actionPending && isConfirm ? "Confirmando..." : action.label}
                    </button>
                  )
                })}
              </div>
              {actionError && (
                <span className="text-xs font-semibold" style={{ color: "#9B1C1C" }}>
                  No se pudo completar la acción. Intenta nuevamente.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPet && <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)} />}
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ hotelId: string }>
}

function HotelBookingsContent({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()
  const queryClient = useQueryClient()
  const [group, setGroup] = useState<BookingGroup>("VIGENTES")

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotel-bookings", hotelId],
    queryFn: () => getHotelBookings(hotelId, apiFetch),
    enabled: !!hotelId,
  })

  const invalidateBookings = () => queryClient.invalidateQueries({ queryKey: ["hotel-bookings", hotelId] })

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => confirmHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) => checkInHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const checkOutMutation = useMutation({
    mutationFn: (bookingId: string) => checkOutHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const noShowMutation = useMutation({
    mutationFn: (bookingId: string) => markNoShowHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const bookings = data?.bookings ?? []

  const filteredBookings = useMemo(
    () => bookings.filter((b) => bookingGroup(b.status) === group),
    [bookings, group]
  )

  const counts = useMemo(() => {
    const c: Record<BookingGroup, number> = { VIGENTES: 0, COMPLETADAS: 0, OTRAS: 0 }
    for (const b of bookings) c[bookingGroup(b.status)]++
    return c
  }, [bookings])

  // Acción pendiente de confirmación en el modal
  const [pendingConfirm, setPendingConfirm] = useState<{ booking: HotelBooking; action: BookingActionKey } | null>(null)

  // Click en el botón de la tarjeta → abre el modal de confirmación
  const requestAction = (booking: HotelBooking, action: BookingActionKey) => {
    setPendingConfirm({ booking, action })
  }

  // Confirmar en el modal → ejecuta la acción real
  const executeAction = () => {
    if (!pendingConfirm) return
    const { booking, action } = pendingConfirm
    const closeOnSuccess = { onSuccess: () => setPendingConfirm(null) }
    if (action === "confirm") {
      confirmMutation.mutate(booking.id, closeOnSuccess)
      return
    }
    if (action === "checkin") {
      checkInMutation.mutate(booking.id, closeOnSuccess)
      return
    }
    if (action === "checkout") {
      checkOutMutation.mutate(booking.id, closeOnSuccess)
      return
    }
    if (action === "no_show") {
      noShowMutation.mutate(booking.id, closeOnSuccess)
      return
    }
  }

  const mutations = [confirmMutation, checkInMutation, checkOutMutation, noShowMutation]
  const actionPendingId = mutations.find((m) => m.isPending)?.variables ?? null
  const actionErroredId = mutations.find((m) => m.isError)?.variables ?? null
  const isActionRunning = mutations.some((m) => m.isPending)

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">

        {/* Header */}
        <div className="grid gap-5 border-b pb-6 lg:grid-cols-[1fr_320px] lg:items-end" style={{ borderColor: "#E5E7EB" }}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ borderColor: "#E5E7EB", color: "#2E7D32" }}>
              <PawPrint size={15} />
              Panel Manager
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#0A1830" }}>
              Reservas
            </h1>
            <p className="mt-3 max-w-[620px] text-base font-medium leading-7" style={{ color: "#526071" }}>
              Gestiona las reservas vigentes, completadas y otras de tu hotel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-2" style={{ borderColor: "#E5E7EB" }}>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#08785B" }}>{counts.VIGENTES}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Vigentes</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#0D2B45" }}>{counts.COMPLETADAS}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Completadas</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#8A94A6" }}>{counts.OTRAS}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Otras</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {([
            { value: "VIGENTES", label: "Vigentes" },
            { value: "COMPLETADAS", label: "Completadas" },
            { value: "OTRAS", label: "Otras" },
          ] as const).map((item) => {
            const active = group === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setGroup(item.value)}
                className="min-h-10 rounded-full border px-4 text-sm font-bold transition-colors"
                style={{
                  backgroundColor: active ? "#0D2B45" : "#F8FAFC",
                  borderColor: active ? "#0D2B45" : "#E5E7EB",
                  color: active ? "#FFFFFF" : "#526071",
                }}
              >
                {item.label} ({counts[item.value]})
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="mt-5 grid gap-5">
          {isLoading && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Cargando reservas...</p>
            </div>
          )}

          {isError && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#F3D1D1" }}>
              <p className="text-sm font-bold" style={{ color: "#8A1C1C" }}>No pudimos cargar las reservas</p>
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

          {!isLoading && !isError && filteredBookings.length === 0 && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: "#E5E7EB", color: "#8A94A6" }}>
                <CalendarDays size={28} />
              </div>
              <p className="mt-4 text-sm font-bold" style={{ color: "#0A1830" }}>No hay reservas para mostrar</p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>
                Cuando tengas reservas, aparecerán aquí.
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onAction={requestAction}
              actionPending={actionPendingId === booking.id}
              actionError={actionErroredId === booking.id}
            />
          ))}
        </div>
      </div>

      {pendingConfirm && (
        <ConfirmActionModal
          action={pendingConfirm.action}
          booking={pendingConfirm.booking}
          isPending={isActionRunning}
          onConfirm={executeAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </section>
  )
}

export default function HotelBookingsPage({ params }: PageProps) {
  const { hotelId } = use(params)
  return (
    <ManagerLayout hotelId={hotelId}>
      <HotelBookingsContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
