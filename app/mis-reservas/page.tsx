"use client"

import Image from "next/image"
import { useMemo, useState, type ReactNode } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useApiClient } from "@/hooks/use-api-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  EllipsisVertical,
  Hotel,
  ImageIcon,
  MapPin,
  MessageSquareText,
  PawPrint,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { AccountSidebar } from "@/components/account-sidebar"
import { getBookingStatusLabel } from "@/lib/booking-status"
import { CancellationPolicyBadge, CancellationPolicyBody } from "@/components/cancellation-policy"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCommuneNameByCode } from "@/config/communes"
import { getMyBookings, requestBookingCancellation, type MyBooking, type MyBookingStatus } from "@/lib/api/bookings"
import { CANCELLATION_POLICY_FLEXIBLE } from "@/lib/api/hotels"
import { createReview } from "@/lib/api/reviews"
import { formatClp } from "@/lib/format"

type BookingFilter = "ACTIVE" | "OTHER"

// Estados que el usuario ve como "reservas activas".
const ACTIVE_STATUSES = new Set<MyBookingStatus>([
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "INITIATED",
  "PENDING_CANCELLATION",
  "COMPLETED",
])

// Estados que el usuario nunca ve (ni siquiera en "Todas"): borradores del flujo de
// reserva (NEW, PETS_SAVED, DOCS_SAVED) y las expiradas. El backend no debería
// devolverlos, pero los filtramos por seguridad.
const HIDDEN_STATUSES = new Set<string>(["NEW", "PETS_SAVED", "DOCS_SAVED", "EXPIRED"])

function formatDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: es })
}

function nightsBetween(checkinDate: string, checkoutDate: string) {
  const checkin = new Date(`${checkinDate}T12:00:00`)
  const checkout = new Date(`${checkoutDate}T12:00:00`)
  return Math.max(1, Math.round((checkout.getTime() - checkin.getTime()) / 86400000))
}

function isCompletedBooking(status: MyBookingStatus) {
  return status === "COMPLETED"
}

// Reserva "activa": las que el usuario ve en el tab "Reservas activas".
function isActiveBooking(status: MyBookingStatus) {
  return ACTIVE_STATUSES.has(status)
}

// Reserva visible para el usuario (aparece en alguna de las dos pestañas). Las
// no visibles (borradores/expiradas) se descartan de todo, incluidos los contadores.
function isVisibleBooking(status: MyBookingStatus) {
  return !HIDDEN_STATUSES.has(status)
}

function statusMeta(status: MyBookingStatus) {
  if (status === "PENDING_PAYMENT") {
    return {
      label: "Pendiente de Pago",
      description: "Esperando el pago del depósito",
      color: "#9B1C1C",
      bg: "#FDE8E8",
      icon: Clock,
    }
  }

  if (status === "PAID") {
    return {
      label: "Abonada",
      description: "Pago inicial recibido",
      color: "#125BD8",
      bg: "#EAF2FF",
      icon: ShieldCheck,
    }
  }

  if (status === "CONFIRMED") {
    return {
      label: "Confirmada",
      description: "Lista para el check-in",
      color: "#08785B",
      bg: "#EAF8F3",
      icon: CheckCircle2,
    }
  }

  if (status === "PENDING_CANCELLATION") {
    return {
      label: "Cancelación pendiente",
      description: "Solicitud de cancelación en revisión",
      color: "#9A3412",
      bg: "#FFF7ED",
      icon: Clock,
    }
  }

  if (status === "COMPLETED") {
    return {
      label: "Completada",
      description: "Estadía completada",
      color: "#0D2B45",
      bg: "#EAF2F8",
      icon: Star,
    }
  }

  return {
    label: "No activa",
    description: "Reserva sin acciones disponibles",
    color: "#0D2B45",
    bg: "#EAF2F8",
    icon: Clock,
  }
}

function petNames(pets: MyBooking["pets"]) {
  const names = pets.map((pet) => pet.name).filter(Boolean)
  if (names.length === 0) return "Sin mascotas"
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

// "2026-08-20" -> "20 de Agosto". Sin año, con el mes capitalizado.
function formatDeadlineDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  const month = format(parsed, "MMMM", { locale: es })
  return `${format(parsed, "d", { locale: es })} de ${month.charAt(0).toUpperCase()}${month.slice(1)}`
}

// "17:00" -> "5pm"; "17:30" -> "5:30pm". Los minutos sólo aparecen si no es hora en punto.
function formatDeadlineTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const suffix = hours < 12 ? "am" : "pm"
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return minutes ? `${hour12}:${String(minutes).padStart(2, "0")}${suffix}` : `${hour12}${suffix}`
}

// Texto del cuadro "Cancelación". El backend entrega el estado ya resuelto
// (ventana de gracia, si se puede cancelar y cuánto se retiene); acá sólo se redacta.
// El contenedor va en bold: los tramos bajan a peso normal todo salvo el titular.
// onShowConditions abre el mismo modal de política que sirve el menú de la reserva.
function cancellationMessage(cancellation: MyBooking["cancellation"], onShowConditions: () => void): ReactNode {
  if (cancellation.freeWindow) {
    return (
      <>
        Gratis{" "}
        <span className="font-normal">durante las dos primeras horas de creada tu reserva</span>
      </>
    )
  }

  if (cancellation.cancellableNow && cancellation.currentFeePct === 0) {
    const deadline = formatDeadlineDate(cancellation.nextDeadline)
    return (
      <>
        Gratis{" "}
        <span className="font-normal">
          {cancellation.deadlineTime
            ? `hasta las ${formatDeadlineTime(cancellation.deadlineTime)} del ${deadline}`
            : `hasta el ${deadline}`}
        </span>
      </>
    )
  }

  if (cancellation.cancellableNow) {
    const conditionsLink = (
      <button
        type="button"
        onClick={onShowConditions}
        className="inline font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
        style={{ color: "#125BD8" }}
      >
        Ver condiciones
      </button>
    )

    if (cancellation.cancellationPolicy === CANCELLATION_POLICY_FLEXIBLE) {
      return (
        <span className="font-normal">
          Reserva fuera de plazo de cancelación gratuita. Se retiene {cancellation.currentFeePct}% si
          cancelas ahora. {conditionsLink}
        </span>
      )
    }

    return (
      <>
        Cancelación por tramos.{" "}
        <span className="font-normal">
          Retención actual: {cancellation.currentFeePct}% del total de la reserva. {conditionsLink}
        </span>
      </>
    )
  }

  return <span className="font-normal">Reserva no reembolsable. Tu cupo está garantizado</span>
}

function HotelPhoto({ src, alt, sizes }: { src: string | null; alt: string; sizes?: string }) {
  if (!src) {
    return (
      <div className="flex h-full min-h-full w-full items-center justify-center bg-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: "#E5E7EB", color: "#8A94A6" }}>
          <ImageIcon size={28} />
        </div>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
    />
  )
}

// Selector de nota 1-10 reutilizable (alojamiento y transporte comparten el mismo control).
function ScoreSelector({ label, score, onChange }: { label: string; score: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{label}</p>
        <p className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: "#FDECC8", color: "#8A6100" }}>
          {score === 0 ? "—" : score}/10
        </p>
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1.5 sm:gap-2">
        {Array.from({ length: 10 }, (_, index) => {
          const value = index + 1
          const filled = value <= score
          const current = value === score
          return (
            <div key={value} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange(value)}
                className="flex aspect-square w-full items-center justify-center rounded-xl border transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: current ? "#FFC43D" : "#FFFFFF",
                  borderColor: current ? "#FFC43D" : "#E5E7EB",
                }}
                aria-label={`${label}: calificar con ${value} de 10`}
              >
                <Star
                  size={26}
                  fill={current ? "#FFFFFF" : filled ? "#F5B000" : "#D6DEE8"}
                  style={{ color: current ? "#FFFFFF" : filled ? "#F5B000" : "#D6DEE8" }}
                />
              </button>
              <span className="text-xs font-semibold" style={{ color: "#8A94A6" }}>{value}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#8A94A6" }}>Muy malo</span>
        <span className="text-xs font-medium" style={{ color: "#8A94A6" }}>Excelente</span>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const { isLoaded } = useAuth()
  const { user } = useUser()
  const { apiFetch } = useApiClient()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<BookingFilter>("ACTIVE")
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null)
  const [policyBooking, setPolicyBooking] = useState<MyBooking | null>(null)
  const [cancellationConfirmed, setCancellationConfirmed] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [bookingToReview, setBookingToReview] = useState<MyBooking | null>(null)
  // 0 = sin nota seleccionada (el modal abre sin ninguna estrella marcada)
  const [reviewScore, setReviewScore] = useState(0)
  const [transportScore, setTransportScore] = useState(0)
  const [positiveText, setPositiveText] = useState("")
  const [negativeText, setNegativeText] = useState("")

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-bookings"],
    enabled: isLoaded,
    queryFn: () => getMyBookings(apiFetch),
  })

  // Base visible: descartamos los estados que el usuario nunca ve (borradores/expiradas).
  const bookings = useMemo(
    () => (data?.bookings ?? []).filter((booking) => isVisibleBooking(booking.status)),
    [data],
  )

  // "Todas" en realidad muestra solo las NO activas (CLOSED, CANCELLED, NO_SHOW);
  // las activas viven en su propia pestaña.
  const filteredBookings = useMemo(() => {
    if (filter === "ACTIVE") return bookings.filter((booking) => isActiveBooking(booking.status))
    return bookings.filter((booking) => !isActiveBooking(booking.status))
  }, [bookings, filter])

  // Contadores excluyentes que suman el total: activas + otras = total visible.
  const activeCount = bookings.filter((booking) => isActiveBooking(booking.status)).length
  const otherCount = bookings.filter((booking) => !isActiveBooking(booking.status)).length

  const openReviewModal = (booking: MyBooking) => {
    setBookingToReview(booking)
    setReviewScore(booking.review.score ?? 0)
    setTransportScore(0)
    setPositiveText("")
    setNegativeText("")
  }

  const reviewMutation = useMutation({
    // Housing siempre; si la reserva incluye transporte, se envía además la review TRANSPORT
    // (segundo llamado, solo con su nota — los comentarios van únicamente en HOUSING).
    mutationFn: async (booking: MyBooking) => {
      await createReview(
        {
          bookingId: booking.id,
          type: "HOUSING",
          stars: reviewScore,
          goodThings: positiveText.trim() || undefined,
          badThings: negativeText.trim() || undefined,
        },
        apiFetch,
      )
      if (booking.transport.included) {
        await createReview(
          {
            bookingId: booking.id,
            type: "TRANSPORT",
            stars: transportScore,
          },
          apiFetch,
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      setBookingToReview(null)
    },
  })

  const cancellationMutation = useMutation({
    mutationFn: (booking: MyBooking) =>
      requestBookingCancellation(
        { bookingId: booking.id, cancellationReason: cancellationReason.trim() },
        apiFetch,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      setCancellationConfirmed(true)
    },
  })

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1400px] min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
        <SiteNavbar />

        <div className="flex flex-1">
          <AccountSidebar />

          <div className="flex-1 min-w-0">
        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1100px]">
            <div className="grid gap-5 border-b pb-6 lg:grid-cols-[1fr_320px] lg:items-end" style={{ borderColor: "#E5E7EB" }}>
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]" style={{ borderColor: "#E5E7EB", color: "#2E7D32" }}>
                  <PawPrint size={15} />
                  Panel de reservas
                </p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#0A1830" }}>
                  Mis reservas
                </h1>
                <p className="mt-3 max-w-[620px] text-base font-medium leading-7" style={{ color: "#526071" }}>
                  Revisa tus estadías confirmadas, cancela reservas próximas o califica las experiencias que ya terminaron.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-2" style={{ borderColor: "#E5E7EB" }}>
                <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
                  <p className="text-2xl font-bold" style={{ color: "#125BD8" }}>{bookings.length}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Total</p>
                </div>
                <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
                  <p className="text-2xl font-bold" style={{ color: "#08785B" }}>{activeCount}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Activas</p>
                </div>
                <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
                  <p className="text-2xl font-bold" style={{ color: "#0D2B45" }}>{otherCount}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Otras</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { value: "ACTIVE", label: "Reservas activas" },
                { value: "OTHER", label: "Todas" },
              ].map((item) => {
                const active = filter === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value as BookingFilter)}
                    className="min-h-10 rounded-full border px-4 text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: active ? "#0D2B45" : "#F8FAFC",
                      borderColor: active ? "#0D2B45" : "#E5E7EB",
                      color: active ? "#FFFFFF" : "#526071",
                    }}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid gap-5">
              {isLoading && (
                <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Cargando tus reservas...</p>
                  <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>Estamos consultando la información guardada en JackCity.</p>
                </div>
              )}

              {isError && (
                <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#F3D1D1" }}>
                  <p className="text-sm font-bold" style={{ color: "#8A1C1C" }}>No pudimos cargar tus reservas</p>
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
                  <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>Cuando tengas reservas confirmadas, aparecerán aquí.</p>
                </div>
              )}

              {!isLoading && !isError && filteredBookings.map((booking) => {
                const meta = statusMeta(booking.status)
                const StatusIcon = meta.icon
                const nights = nightsBetween(booking.checkinDate, booking.checkoutDate)
                const isCompleted = isCompletedBooking(booking.status)
                // El cuadro "Cancelación" sólo aplica a reservas vigentes: en una cancelada
                // o cerrada el mensaje ya no dice nada útil.
                const isActive = isActiveBooking(booking.status)
                // Único criterio: lo resuelve el backend en cancellableNow.
                const canRequestCancellation = booking.cancellation.cancellableNow
                // Disponible en cualquier reserva del tab "Reservas activas", siempre que
                // el backend haya informado la política (si no, no hay texto que mostrar).
                const canViewPolicy = isActive && !!booking.cancellation.cancellationPolicy
                const communeName = getCommuneNameByCode(booking.hotel.commune)

                return (
                  <article key={booking.id} className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: "#E5E7EB" }}>
                    <div className="grid lg:grid-cols-[280px_1fr]">
                      <div className="relative min-h-[230px] overflow-hidden bg-[#EEF2F7]">
                        <HotelPhoto src={booking.hotel.mainPhotoUrl} alt={booking.hotel.name} sizes="(min-width: 1024px) 280px, 100vw" />
                        {booking.hotel.mainPhotoUrl && (
                          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,24,48,0.04) 0%, rgba(10,24,48,0.42) 100%)" }} />
                        )}
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow" style={{ backgroundColor: meta.bg, color: meta.color }}>
                          <StatusIcon size={14} />
                          {getBookingStatusLabel(booking.status)}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h2 className="text-2xl font-bold leading-tight" style={{ color: booking.hotel.mainPhotoUrl ? "#FFFFFF" : "#0A1830" }}>{booking.hotel.name}</h2>
                        </div>
                      </div>

                      <div className="relative flex flex-col gap-5 p-5 sm:p-6">
                        <div className="absolute right-4 top-4 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#F8FAFC]"
                                style={{ borderColor: "#E5E7EB", color: "#526071" }}
                                aria-label={`Abrir opciones de la reserva ${booking.id}`}
                              >
                                <EllipsisVertical size={18} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-lg border bg-white p-1 shadow-lg" style={{ borderColor: "#E5E7EB" }}>
                              {canViewPolicy && (
                                <DropdownMenuItem
                                  onSelect={() => setPolicyBooking(booking)}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold"
                                  style={{ color: "#0A1830" }}
                                >
                                  <ShieldCheck size={16} style={{ color: "#15803D" }} />
                                  Ver política de cancelación
                                </DropdownMenuItem>
                              )}
                              {canRequestCancellation && (
                                <DropdownMenuItem
                                  onSelect={() => setBookingToCancel(booking)}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold"
                                  style={{ color: "#8A1C1C" }}
                                >
                                  <XCircle size={16} style={{ color: "#8A1C1C" }} />
                                  Solicitar cancelación
                                </DropdownMenuItem>
                              )}
                              {!canViewPolicy && !canRequestCancellation && (
                                <DropdownMenuItem disabled className="rounded-md px-3 py-2 text-sm font-semibold">
                                  Sin acciones disponibles
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold" style={{ backgroundColor: "#EAF2FF", color: "#125BD8" }}>
                              <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A94A6" }}>Reserva N°</span>
                              {booking.number}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-bold" style={{ color: "#526071" }}>
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin size={15} style={{ color: "#125BD8" }} />
                                {communeName}, {booking.hotel.city}
                              </span>
                              <span className="hidden sm:inline" style={{ color: "#CBD5E1" }}>|</span>
                              <span className="inline-flex items-center gap-1.5">
                                <PawPrint size={15} style={{ color: "#2E7D32" }} />
                                {petNames(booking.pets)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>
                              {meta.description}
                            </p>
                          </div>

                          <div className="mr-12 rounded-lg border px-4 py-3 text-left lg:text-right" style={{ backgroundColor: "#F8FAFC", borderColor: "#E5E7EB" }}>
                            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>Pagado</p>
                            <p className="mt-1 text-xl font-bold" style={{ color: "#0A1830" }}>{formatClp(booking.pricing.paidPrice)}</p>
                            <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>Total {formatClp(booking.pricing.totalPrice)}</p>
                          </div>
                        </div>

                        <div className={`grid gap-3 ${isActive ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
                              <CalendarDays size={14} />
                              Fechas
                            </p>
                            <p className="mt-2 text-sm font-bold" style={{ color: "#0A1830" }}>
                              {formatDate(booking.checkinDate)} - {formatDate(booking.checkoutDate)}
                            </p>
                            <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>{nights} noche{nights === 1 ? "" : "s"}</p>
                          </div>
                          <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
                              <Hotel size={14} />
                              Hotel
                            </p>
                            <p className="mt-2 text-sm font-bold" style={{ color: "#0A1830" }}>{booking.hotel.name}</p>
                            <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>{booking.transport.included ? "Transporte incluido" : "Sin transporte"}</p>
                          </div>
                          {isActive && (
                            <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
                              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
                                <Clock size={14} />
                                Cancelación
                              </p>
                              <p className="mt-2 text-sm font-bold" style={{ color: "#0A1830" }}>
                                {cancellationMessage(booking.cancellation, () => setPolicyBooking(booking))}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#EEF2F7" }}>
                          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#526071" }}>
                            {booking.review.hasReview ? (
                              <>
                                <Star size={17} fill="#F5B000" style={{ color: "#F5B000" }} />
                                Calificada con {booking.review.score}/10
                              </>
                            ) : isCompleted ? (
                              <>
                                <MessageSquareText size={17} style={{ color: "#2E7D32" }} />
                                Tu opinión ayuda a otras familias
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={17} style={{ color: "#08785B" }} />
                                Reserva activa y confirmada
                              </>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            {booking.status === "PENDING_PAYMENT" && (
                              <a
                                href={`/booking/confirmation/error?bookingId=${booking.id}&retryable=true`}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-opacity hover:opacity-90"
                                style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                              >
                                Reintentar pago de reserva
                              </a>
                            )}
                            {isCompleted && !booking.review.hasReview && (
                              <button
                                type="button"
                                onClick={() => openReviewModal(booking)}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-opacity"
                                style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                              >
                                <Star size={17} fill="currentColor" />
                                Calificar reserva
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
          </div>
        </div>

        <Dialog open={!!policyBooking?.cancellation.cancellationPolicy} onOpenChange={(open) => { if (!open) setPolicyBooking(null) }}>
          <DialogContent className="rounded-lg border-0 bg-white p-0 sm:max-w-[500px]">
            {policyBooking?.cancellation.cancellationPolicy && (
              <div className="overflow-hidden rounded-lg">
                <div className="px-6 py-5" style={{ backgroundColor: "#F5F8FC" }}>
                  <DialogHeader>
                    <DialogTitle className="flex flex-wrap items-center gap-2 text-xl font-bold" style={{ color: "#0A1830" }}>
                      Política de Cancelación
                      <CancellationPolicyBadge policy={policyBooking.cancellation.cancellationPolicy} />
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm font-medium" style={{ color: "#526071" }}>
                      {policyBooking.hotel.name} · {formatDate(policyBooking.checkinDate)} – {formatDate(policyBooking.checkoutDate)}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="px-6 py-5">
                  <CancellationPolicyBody policy={policyBooking.cancellation.cancellationPolicy} />
                </div>

                <DialogFooter className="border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                  <button
                    type="button"
                    onClick={() => setPolicyBooking(null)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
                  >
                    Entendido
                  </button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!bookingToCancel} onOpenChange={(open) => { if (!open) { setBookingToCancel(null); setCancellationConfirmed(false); setCancellationReason(""); cancellationMutation.reset() } }}>
          <DialogContent className="rounded-lg border-0 bg-white p-0 sm:max-w-[500px]">
            {bookingToCancel && (
              <div className="overflow-hidden rounded-lg">
                {cancellationConfirmed ? (
                  <>
                    <div className="px-6 py-5" style={{ backgroundColor: "#EAF8F3" }}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: "#08785B" }}>
                          <CheckCircle2 size={22} />
                          Solicitud recibida
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm font-medium" style={{ color: "#2E6B55" }}>
                          Tu solicitud de cancelación fue enviada correctamente.
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="px-6 py-6">
                      <p className="text-sm font-medium leading-7" style={{ color: "#0A1830" }}>
                        Nuestro equipo de soporte ya ha recibido tu solicitud para cancelar esta reserva, nos contactaremos contigo a la brevedad a través del correo:{" "}
                        <span className="font-bold">{user?.primaryEmailAddress?.emailAddress}</span>.
                      </p>
                      <p className="mt-4 text-sm font-semibold" style={{ color: "#526071" }}>
                        Saludos,<br />JackCity team
                      </p>
                    </div>

                    <DialogFooter className="border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                      <button
                        type="button"
                        onClick={() => { setBookingToCancel(null); setCancellationConfirmed(false); setCancellationReason(""); cancellationMutation.reset() }}
                        className="min-h-11 rounded-full px-5 text-sm font-bold"
                        style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                      >
                        Cerrar
                      </button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <div className="px-6 py-5" style={{ backgroundColor: "#FFF5F5" }}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: "#8A1C1C" }}>
                          <XCircle size={22} />
                          Cancelar reserva
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm font-medium" style={{ color: "#6B4E4E" }}>
                          Esta acción no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                    </div>

                    <div className="px-6 py-5">
                      <div className="rounded-lg border p-4" style={{ borderColor: "#F3D1D1", backgroundColor: "#FFFBFB" }}>
                        {(() => {
                          const meta = statusMeta(bookingToCancel.status)
                          const StatusIcon = meta.icon
                          return (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: meta.bg, color: meta.color }}>
                              <StatusIcon size={12} />
                              {getBookingStatusLabel(bookingToCancel.status)}
                            </span>
                          )
                        })()}
                        <p className="mt-2 text-sm font-bold" style={{ color: "#0A1830" }}>{bookingToCancel.hotel.name}</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: "#667085" }}>
                          {formatDate(bookingToCancel.checkinDate)} – {formatDate(bookingToCancel.checkoutDate)} · {petNames(bookingToCancel.pets)}
                        </p>
                      </div>

                      <p className="mt-5 text-base font-bold leading-6" style={{ color: "#0A1830" }}>
                        ¿Confirmas que deseas cancelar esta reserva?
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6" style={{ color: "#526071" }}>
                        Revisaremos los pagos de tu reserva para determinar tu devolución. Consideramos
                        tanto lo que pagaste a través de JackCity como cualquier monto abonado
                        directamente al hotel, y aplicamos la política de cancelación vigente para esta
                        reserva. Te contactaremos con el detalle a la brevedad.
                      </p>

                      <label className="mt-5 block">
                        <span className="text-sm font-bold" style={{ color: "#0A1830" }}>
                          Motivo de la cancelación
                        </span>
                        <textarea
                          value={cancellationReason}
                          onChange={(event) => setCancellationReason(event.target.value)}
                          rows={4}
                          className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-[#B42318]"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                          placeholder="Cuéntanos por qué quieres cancelar (nos ayuda a mejorar)..."
                        />
                      </label>
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t px-6 py-4 sm:flex-row" style={{ borderColor: "#F3D1D1" }}>
                      {cancellationMutation.isError && (
                        <p className="w-full text-sm font-semibold sm:mr-auto sm:w-auto sm:self-center" style={{ color: "#B42318" }}>
                          No pudimos enviar tu solicitud. Intenta de nuevo.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => { setBookingToCancel(null); setCancellationReason(""); cancellationMutation.reset() }}
                        disabled={cancellationMutation.isPending}
                        className="min-h-11 rounded-full border-2 px-5 text-sm font-bold disabled:opacity-60"
                        style={{ borderColor: "#CBD5E1", color: "#526071" }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => cancellationMutation.mutate(bookingToCancel)}
                        disabled={cancellationMutation.isPending}
                        className="min-h-11 rounded-full px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ backgroundColor: "#B42318", color: "#FFFFFF" }}
                      >
                        {cancellationMutation.isPending ? "Enviando..." : "Confirmar"}
                      </button>
                    </DialogFooter>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!bookingToReview} onOpenChange={(open) => { if (!open) { setBookingToReview(null); reviewMutation.reset() } }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white p-0 sm:max-w-[720px]">
            {bookingToReview && (
              <div className="rounded-2xl">
                <div className="px-6 pt-6 pb-2">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2.5 text-2xl font-bold" style={{ color: "#0D2B45" }}>
                      <Star size={24} fill="currentColor" />
                      Calificar reserva
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium" style={{ color: "#667085" }}>
                      {bookingToReview.transport.included
                        ? "Califica de 1 a 10 el alojamiento y el transporte, y déjanos dos comentarios simples."
                        : "Una calificación de 1 a 10 y dos comentarios simples para entender la experiencia."}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="px-6 py-4">
                  <div className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: "#E5E7EB" }}>
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#EEF2F7]">
                      <HotelPhoto src={bookingToReview.hotel.mainPhotoUrl} alt={bookingToReview.hotel.name} sizes="96px" />
                    </div>
                    <div>
                      <p className="text-base font-bold" style={{ color: "#0A1830" }}>{bookingToReview.hotel.name}</p>
                      <p className="mt-1.5 text-sm font-semibold" style={{ color: "#667085" }}>
                        {formatDate(bookingToReview.checkinDate)} - {formatDate(bookingToReview.checkoutDate)}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold" style={{ color: "#8A94A6" }}>{petNames(bookingToReview.pets)}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <ScoreSelector
                      label={bookingToReview.transport.included ? "Nota de alojamiento" : "Tu nota"}
                      score={reviewScore}
                      onChange={setReviewScore}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Lo positivo</span>
                      <textarea
                        value={positiveText}
                        onChange={(event) => setPositiveText(event.target.value)}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-[#FFC43D]"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="Qué te gustó del hotel, del cuidado o del proceso..."
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Lo negativo</span>
                      <textarea
                        value={negativeText}
                        onChange={(event) => setNegativeText(event.target.value)}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-[#FFC43D]"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="Qué podría mejorar para la próxima estadía..."
                      />
                    </label>
                  </div>

                  {bookingToReview.transport.included && (
                    <div className="mt-6">
                      <ScoreSelector
                        label="Nota de transporte"
                        score={transportScore}
                        onChange={setTransportScore}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end" style={{ borderColor: "#E5E7EB" }}>
                  {reviewMutation.isError && (
                    <p className="w-full text-sm font-semibold sm:mr-auto sm:w-auto sm:self-center" style={{ color: "#D92D20" }}>
                      No pudimos guardar tu calificación. Intenta de nuevo.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setBookingToReview(null)}
                    disabled={reviewMutation.isPending}
                    className="min-h-11 rounded-full border px-6 text-sm font-bold transition-colors hover:bg-gray-50 disabled:opacity-60"
                    style={{ borderColor: "#CBD5E1", color: "#526071" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate(bookingToReview)}
                    disabled={
                      reviewMutation.isPending ||
                      reviewScore === 0 ||
                      (bookingToReview.transport.included && transportScore === 0)
                    }
                    className="min-h-11 rounded-full px-6 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                  >
                    {reviewMutation.isPending ? "Enviando..." : "Enviar calificación"}
                  </button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
