"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteNavbar } from "@/components/site-navbar"
import { MapPin, Clock, Calendar, AlertCircle, LockKeyhole, Building2 } from "lucide-react"
import { formatClp } from "@/lib/format"
import { getBooking } from "@/lib/api/bookings"
import { slotTime } from "@/lib/transport-slots"

const PAY_NOW_PERCENTAGE = 0.3

function formatDate(dateStr: string) {
  return format(new Date(`${dateStr}T12:00:00`), "d 'de' MMMM", { locale: es })
}

function formatPetNames(names: string[]) {
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  })

  if (!bookingId || isError) {
    return (
      <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
        <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
          <SiteNavbar />
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
            No pudimos cargar los datos de tu reserva.
          </div>
        </div>
      </main>
    )
  }

  if (isLoading || !booking) {
    return (
      <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
        <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
          <SiteNavbar />
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
            Cargando tu reserva...
          </div>
        </div>
      </main>
    )
  }

  const petNames = formatPetNames(booking.pets.map((p) => p.name))
  const checkinDate = new Date(`${booking.checkinDate}T12:00:00`)
  const checkoutDate = new Date(`${booking.checkoutDate}T12:00:00`)
  const nights = Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000)
  const checkinFormatted = formatDate(booking.checkinDate)
  const checkoutFormatted = formatDate(booking.checkoutDate)
  const cancellationFormatted = formatDate(booking.freeCancellationDeadline)
  const totalPrice = booking.pricing.totalPrice
  const paidPrice = Math.round(totalPrice * PAY_NOW_PERCENTAGE)
  const pendingPrice = totalPrice - paidPrice
  const checkinWindow = booking.transport.included
    ? slotTime(booking.transport.departureSlot ?? "")
    : booking.hotel.checkinWindow
  const checkinWindowLabel = checkinWindow.trim() || "Horario por coordinar"

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="w-full px-2 pb-6 md:px-6 md:pb-8 pt-4">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left column — hotel photo */}
            <div className="flex flex-col gap-4 lg:w-1/4 order-1">
              <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={booking.hotel.mainPhotoUrl ?? "/images/hotel-patitas-inn.jpg"}
                    alt={booking.hotel.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm" style={{ color: "#0A1830" }}>{booking.hotel.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} style={{ color: "#6B7280" }} />
                    <span className="text-xs" style={{ color: "#6B7280" }}>{booking.hotel.commune}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — success content */}
            <div className="flex flex-col gap-1 lg:w-3/4 order-2">

              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 py-0">
                <div className="w-full flex-1 pt-2 sm:pt-4">
                  <h1 className="text-2xl md:text-3xl font-bold mb-0" style={{ color: "#0A1830" }}>
                    Felicitaciones!
                  </h1>
                  <p className="text-lg md:text-xl" style={{ color: "#555" }}>
                    Ya esta lista la reserva para tu peque
                  </p>
                </div>
                <div className="relative w-[calc(100vw-1rem)] max-w-none sm:w-[26rem] lg:w-[26rem] aspect-[1133/681] flex-shrink-0">
                  <Image
                    src="/images/jack-reserva-exitosa.jpg"
                    alt="Jack celebrando"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Reservation data */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: "#0A1830" }}>
                  Datos de la Reserva
                </h2>

                <div className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-2 text-sm" style={{ color: "#333" }}>
                    <li className="flex items-center gap-2">
                      <span>{booking.pets.length} {booking.pets.length === 1 ? "mascota" : "mascotas"} ({petNames})</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar size={16} style={{ color: "#0A1830" }} />
                      <span>{nights} {nights === 1 ? "noche" : "noches"} ({checkinFormatted} al {checkoutFormatted})</span>
                    </li>
                    {booking.transport.included && (
                      <li className="flex items-center gap-2">
                        <span>Transporte Incluido</span>
                      </li>
                    )}
                  </ul>

                  <div className="pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                    <div className="grid min-w-0 items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)]">
                      <div className="min-w-0 rounded-2xl p-3 border shadow-sm md:p-4" style={{ backgroundColor: "#FFFFFF", borderColor: "#EEF0F5" }}>
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Total Alojamiento (100%)</p>
                        <p className="mt-1 text-xs" style={{ color: "#667085" }}>Monto total de tu reserva</p>
                        <p className="mt-5 text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(totalPrice)}</p>
                        <p className="mt-1 text-xs" style={{ color: "#8A94A6" }}>IVA incluido</p>
                      </div>

                      <div className="hidden md:flex items-center justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: "#F3F4F6", color: "#0A1830" }}>
                          =
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl p-3 border shadow-sm md:p-4" style={{ backgroundColor: "#FFFBF0", borderColor: "#FFD47A" }}>
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Reserva pagada (30%)</p>
                        <p className="mt-1 text-xs" style={{ color: "#667085" }}>Pago realizado para confirmar</p>
                        <p className="mt-5 text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(paidPrice)}</p>
                        <p className="mt-1 text-xs" style={{ color: "#8A94A6" }}>IVA incluido</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold" style={{ backgroundColor: "#FFE9A8", color: "#C77700" }}>
                          <LockKeyhole size={13} />
                          Ya pagado
                        </div>
                      </div>

                      <div className="hidden md:flex items-center justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-semibold" style={{ backgroundColor: "#F3F4F6", color: "#0A1830" }}>
                          +
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl p-3 border shadow-sm md:p-4" style={{ backgroundColor: "#F8FBFF", borderColor: "#BFD7FF" }}>
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Pendiente en el hotel (70%)</p>
                        <p className="mt-1 text-xs" style={{ color: "#667085" }}>Abona directamente en el hotel</p>
                        <p className="mt-5 text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(pendingPrice)}</p>
                        <p className="mt-1 text-xs" style={{ color: "#8A94A6" }}>IVA incluido</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold" style={{ backgroundColor: "#DCEBFF", color: "#2563EB" }}>
                          <Building2 size={13} />
                          Se paga en el hotel
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminder card */}
              <div
                className="relative overflow-hidden rounded-2xl border-2 p-5 shadow-sm"
                style={{ backgroundColor: "#FFF7D6", borderColor: "#FFC43D" }}
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full" style={{ backgroundColor: "#FFE8A3" }} />

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}>
                      <AlertCircle size={23} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: "#0A1830" }}>
                        Recuerda!
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: "#333" }}>
                        {booking.transport.included ? "Pasaremos a buscar" : "Estaremos esperando"} a <strong>{petNames}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm" style={{ borderColor: "#FFD47A" }}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: "#C77700" }}>
                        <Calendar size={15} />
                        Fecha
                      </div>
                      <p className="mt-2 text-lg font-bold" style={{ color: "#0A1830" }}>
                        {checkinFormatted}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm" style={{ borderColor: "#FFD47A" }}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: "#C77700" }}>
                        <Clock size={15} />
                        Horario
                      </div>
                      <p className="mt-2 text-lg font-bold" style={{ color: "#0A1830" }}>
                        {checkinWindowLabel}
                      </p>
                    </div>
                  </div>

                  <p className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "#FFEDB8", color: "#51400B" }}>
                    {booking.transport.included
                      ? "Coordinaremos los detalles por anticipacion."
                      : "Te recomendamos llegar dentro del horario indicado."}
                  </p>
                </div>
              </div>

              {/* Cancellation policy */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                      La cancelacion de esta reserva la puedes realizar sin costo hasta el <strong>{cancellationFormatted}</strong>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
