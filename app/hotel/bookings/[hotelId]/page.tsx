"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
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
} from "lucide-react"
import { ManagerLayout } from "@/components/manager-layout"
import { useApiClient } from "@/hooks/use-api-client"
import { formatClp } from "@/lib/format"
import { getHotelBookings, type HotelBooking, type HotelBookingStatus, type TransportSlot, type BookingPet } from "@/lib/api/hotel-bookings"
import { getBookingStatusLabel } from "@/lib/booking-status"

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BookingFilter = "ALL" | "UPCOMING" | "COMPLETED"

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

function isPending(status: HotelBookingStatus) {
  return status === "PAID" || status === "CONFIRMED"
}

function isCompleted(status: HotelBookingStatus) {
  return status === "COMPLETED"
}

function statusMeta(status: HotelBookingStatus) {
  if (status === "PENDING_PAYMENT") return { label: "Pendiente de Pago", color: "#9B1C1C", bg: "#FDE8E8", icon: Clock }
  if (status === "PAID") return { label: "Pagada", color: "#125BD8", bg: "#EAF2FF", icon: ShieldCheck }
  if (status === "CONFIRMED") return { label: "Confirmada", color: "#08785B", bg: "#EAF8F3", icon: CheckCircle2 }
  if (status === "COMPLETED") return { label: "Completada", color: "#0D2B45", bg: "#EAF2F8", icon: Star }
  return { label: "Cancelada", color: "#526071", bg: "#F3F4F6", icon: Clock }
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

function BookingCard({ booking }: { booking: HotelBooking }) {
  const meta = statusMeta(booking.status)
  const StatusIcon = meta.icon
  const nights = nightsBetween(booking.checkinDate, booking.checkoutDate)
  const [selectedPet, setSelectedPet] = useState<BookingPet | null>(null)

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

        {/* Bottom: contact */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4" style={{ borderColor: "#EEF2F7" }}>
          <span className="text-xs font-semibold" style={{ color: "#8A94A6" }}>Contacto:</span>
          <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.email}</span>
          {booking.customer.phone && (
            <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.phone}</span>
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
  const [filter, setFilter] = useState<BookingFilter>("ALL")

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotel-bookings", hotelId],
    queryFn: () => getHotelBookings(hotelId, apiFetch),
    enabled: !!hotelId,
  })

  const bookings = data?.bookings ?? []

  const filteredBookings = useMemo(() => {
    if (filter === "UPCOMING") return bookings.filter((b) => isPending(b.status))
    if (filter === "COMPLETED") return bookings.filter((b) => isCompleted(b.status))
    return bookings
  }, [bookings, filter])

  const upcomingCount = bookings.filter((b) => isPending(b.status)).length
  const completedCount = bookings.filter((b) => isCompleted(b.status)).length

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
              Revisa las reservas activas, próximas y completadas de tu hotel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-2" style={{ borderColor: "#E5E7EB" }}>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#125BD8" }}>{bookings.length}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Total</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#08785B" }}>{upcomingCount}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Próximas</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#0D2B45" }}>{completedCount}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Completadas</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { value: "ALL", label: "Todas" },
            { value: "UPCOMING", label: "Próximas" },
            { value: "COMPLETED", label: "Completadas" },
          ].map((item) => {
            const active = filter === item.value
            const isAll = item.value === "ALL"
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value as BookingFilter)}
                className="min-h-10 rounded-full border px-4 text-sm font-bold transition-colors"
                style={{
                  backgroundColor: active && isAll ? "#FFC43D" : active ? "#0D2B45" : "#F8FAFC",
                  borderColor: active && isAll ? "#FFC43D" : active ? "#0D2B45" : "#E5E7EB",
                  color: active && isAll ? "#0D2B45" : active ? "#FFFFFF" : "#526071",
                }}
              >
                {item.label}
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
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HotelBookingsPage({ params }: PageProps) {
  const { hotelId } = await params
  return (
    <ManagerLayout hotelId={hotelId}>
      <HotelBookingsContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
