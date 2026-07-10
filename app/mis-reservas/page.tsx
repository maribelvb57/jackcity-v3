"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useApiClient } from "@/hooks/use-api-client"
import { useQuery } from "@tanstack/react-query"
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
import { getMyBookings, type MyBooking, type MyBookingStatus } from "@/lib/api/bookings"
import { formatClp } from "@/lib/format"

type BookingFilter = "ALL" | "UPCOMING" | "COMPLETED"

function formatDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: es })
}

function nightsBetween(checkinDate: string, checkoutDate: string) {
  const checkin = new Date(`${checkinDate}T12:00:00`)
  const checkout = new Date(`${checkoutDate}T12:00:00`)
  return Math.max(1, Math.round((checkout.getTime() - checkin.getTime()) / 86400000))
}

function isPendingBooking(status: MyBookingStatus) {
  return status === "PAID" || status === "CONFIRMED"
}

function isCompletedBooking(status: MyBookingStatus) {
  return status === "COMPLETED"
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
      label: "Pagada",
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

function formatCancellationLabel(booking: MyBooking) {
  return booking.cancellation.label || `Gratis hasta ${formatDate(booking.cancellation.freeCancellationDeadline)}`
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

export default function MyBookingsPage() {
  const { isLoaded } = useAuth()
  const { user } = useUser()
  const { apiFetch } = useApiClient()
  const [filter, setFilter] = useState<BookingFilter>("ALL")
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null)
  const [cancellationConfirmed, setCancellationConfirmed] = useState(false)
  const [bookingToReview, setBookingToReview] = useState<MyBooking | null>(null)
  const [reviewScore, setReviewScore] = useState(8)
  const [positiveText, setPositiveText] = useState("")
  const [negativeText, setNegativeText] = useState("")

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-bookings"],
    enabled: isLoaded,
    queryFn: () => getMyBookings(apiFetch),
  })

  const bookings = data?.bookings ?? []

  const filteredBookings = useMemo(() => {
    if (filter === "UPCOMING") return bookings.filter((booking) => isPendingBooking(booking.status))
    if (filter === "COMPLETED") return bookings.filter((booking) => isCompletedBooking(booking.status))
    return bookings
  }, [bookings, filter])

  const upcomingCount = bookings.filter((booking) => isPendingBooking(booking.status)).length
  const completedCount = bookings.filter((booking) => isCompletedBooking(booking.status)).length

  const openReviewModal = (booking: MyBooking) => {
    setBookingToReview(booking)
    setReviewScore(booking.review.score ?? 8)
    setPositiveText("")
    setNegativeText("")
  }

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
                  <p className="text-2xl font-bold" style={{ color: "#08785B" }}>{upcomingCount}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Próximas</p>
                </div>
                <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
                  <p className="text-2xl font-bold" style={{ color: "#0D2B45" }}>{completedCount}</p>
                  <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Completadas</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { value: "ALL", label: "Todas" },
                { value: "UPCOMING", label: "Pendientes" },
                { value: "COMPLETED", label: "Completadas" },
              ].map((item) => {
                const active = filter === item.value
                const allActive = active && item.value === "ALL"
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value as BookingFilter)}
                    className="min-h-10 rounded-full border px-4 text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: allActive ? "#FFC43D" : active ? "#0D2B45" : "#F8FAFC",
                      borderColor: allActive ? "#FFC43D" : active ? "#0D2B45" : "#E5E7EB",
                      color: allActive ? "#0D2B45" : active ? "#FFFFFF" : "#526071",
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
                const isUpcoming = isPendingBooking(booking.status)
                const isCompleted = isCompletedBooking(booking.status)
                const canRequestCancellation = isUpcoming && booking.cancellation.canCancel
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
                              {canRequestCancellation ? (
                                <DropdownMenuItem
                                  onSelect={() => setBookingToCancel(booking)}
                                  className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold"
                                  style={{ color: "#8A1C1C" }}
                                >
                                  <XCircle size={16} style={{ color: "#8A1C1C" }} />
                                  Solicitar cancelación
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled className="rounded-md px-3 py-2 text-sm font-semibold">
                                  Sin acciones disponibles
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="mb-2 inline-block rounded border px-2 py-0.5 font-mono text-xs font-bold" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC", color: "#526071" }}>{booking.status}</p>
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

                        <div className={`grid gap-3 ${isUpcoming ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
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
                          {canRequestCancellation && (
                            <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
                              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#8A94A6" }}>
                                <Clock size={14} />
                                Cancelación
                              </p>
                              <p className="mt-2 text-sm font-bold" style={{ color: "#0A1830" }}>
                                {formatCancellationLabel(booking)}
                              </p>
                              <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>Disponible para cancelar</p>
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

        <Dialog open={!!bookingToCancel} onOpenChange={(open) => { if (!open) { setBookingToCancel(null); setCancellationConfirmed(false) } }}>
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
                        onClick={() => { setBookingToCancel(null); setCancellationConfirmed(false) }}
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

                      <p className="mt-5 text-sm font-medium leading-6" style={{ color: "#0A1830" }}>
                        ¿Confirmas que deseas cancelar la reserva y pedir el reembolso del dinero de la reserva por{" "}
                        <span className="text-base font-bold">{formatClp(bookingToCancel.pricing.paidPrice)}</span>?
                      </p>
                    </div>

                    <DialogFooter className="border-t px-6 py-4 gap-2" style={{ borderColor: "#F3D1D1" }}>
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(null)}
                        className="min-h-11 rounded-full border-2 px-5 text-sm font-bold"
                        style={{ borderColor: "#CBD5E1", color: "#526071" }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellationConfirmed(true)}
                        className="min-h-11 rounded-full px-5 text-sm font-bold"
                        style={{ backgroundColor: "#B42318", color: "#FFFFFF" }}
                      >
                        Confirmar
                      </button>
                    </DialogFooter>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!bookingToReview} onOpenChange={(open) => !open && setBookingToReview(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-0 bg-white p-0 sm:max-w-[680px]">
            {bookingToReview && (
              <div className="overflow-hidden rounded-lg">
                <div className="px-6 py-5" style={{ backgroundColor: "#EAF2F8" }}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold" style={{ color: "#0D2B45" }}>
                      <Star size={24} fill="currentColor" />
                      Calificar reserva
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium" style={{ color: "#526071" }}>
                      Una calificación de 1 a 10 y dos comentarios simples para entender la experiencia.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="px-6 py-5">
                  <div className="flex gap-4 rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#EEF2F7]">
                      <HotelPhoto src={bookingToReview.hotel.mainPhotoUrl} alt={bookingToReview.hotel.name} sizes="80px" />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{bookingToReview.hotel.name}</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: "#667085" }}>
                        {formatDate(bookingToReview.checkinDate)} - {formatDate(bookingToReview.checkoutDate)}
                      </p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "#8A94A6" }}>{petNames(bookingToReview.pets)}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Tu nota</p>
                      <p className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: "#FFF8E4", color: "#8A6100" }}>
                        {reviewScore}/10
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                      {Array.from({ length: 10 }, (_, index) => {
                        const value = index + 1
                        const selected = value <= reviewScore
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewScore(value)}
                            className="relative flex aspect-square items-center justify-center rounded-md border text-xs font-bold transition-transform hover:-translate-y-0.5"
                            style={{
                              backgroundColor: selected ? "#FFF3C4" : "#FFFFFF",
                              borderColor: selected ? "#F5B000" : "#DDE3EC",
                              color: selected ? "#7A4F00" : "#8A94A6",
                            }}
                            aria-label={`Calificar con ${value} de 10`}
                          >
                            <Star size={30} fill={selected ? "#F5B000" : "transparent"} style={{ color: selected ? "#F5B000" : "#CBD5E1" }} />
                            <span className="absolute inset-0 flex items-center justify-center pt-[1px] text-[11px] font-bold">
                              {value}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Lo positivo</span>
                      <textarea
                        value={positiveText}
                        onChange={(event) => setPositiveText(event.target.value)}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-lg border px-4 py-3 text-sm font-medium outline-none focus:border-[#FFC43D]"
                        style={{ borderColor: "#DDE3EC", color: "#0A1830" }}
                        placeholder="Qué te gustó del hotel, del cuidado o del proceso..."
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Lo negativo</span>
                      <textarea
                        value={negativeText}
                        onChange={(event) => setNegativeText(event.target.value)}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-lg border px-4 py-3 text-sm font-medium outline-none focus:border-[#FFC43D]"
                        style={{ borderColor: "#DDE3EC", color: "#0A1830" }}
                        placeholder="Qué podría mejorar para la próxima estadía..."
                      />
                    </label>
                  </div>
                </div>

                <DialogFooter className="border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
                  <button
                    type="button"
                    onClick={() => setBookingToReview(null)}
                    className="min-h-11 rounded-full border-2 px-5 text-sm font-bold"
                    style={{ borderColor: "#CBD5E1", color: "#526071" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingToReview(null)}
                    className="min-h-11 rounded-full px-5 text-sm font-bold"
                    style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                  >
                    Enviar calificación
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
