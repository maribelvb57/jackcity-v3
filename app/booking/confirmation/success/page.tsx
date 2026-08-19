"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteNavbar } from "@/components/site-navbar"
import { MapPin, Calendar, AlertCircle, LockKeyhole, Building2, ReceiptText, Download, Info } from "lucide-react"
import { formatClp } from "@/lib/format"
import { getBooking } from "@/lib/api/bookings"
import { CANCELLATION_POLICY_FLEXIBLE } from "@/lib/api/hotels"
import { getWebpayVoucherByBuyOrder, getWebpayVoucherPdfUrl } from "@/lib/api/payments"
import { pushPurchaseEvent } from "@/lib/analytics"

const MERCHANT_NAME = "AndesBits SpA (JackCity)"
const DEBIT_PAYMENT_TYPE_CODES = new Set(["VD", "VP"])

function formatDate(dateStr: string) {
  return format(new Date(`${dateStr}T12:00:00`), "d 'de' MMMM", { locale: es })
}

function formatPetNames(names: string[]) {
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

function paymentTypeLabel(code: string | null) {
  if (!code) return "—"
  return DEBIT_PAYMENT_TYPE_CODES.has(code) ? "Tarjeta de Débito" : "Tarjeta de Crédito"
}

function installmentsLabel(count: number | null) {
  if (!count || count <= 0) return "Sin cuotas"
  return `${count} cuota${count === 1 ? "" : "s"}`
}

function FallbackScreen({ message, tone = "error" }: { message: string; tone?: "error" | "neutral" }) {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />
        <div className="px-6 py-10 text-sm font-medium" style={{ color: tone === "error" ? "#8A1C1C" : "#0A1830" }}>
          {message}
        </div>
      </div>
    </main>
  )
}

function BookingConfirmationSuccessContent() {
  const searchParams = useSearchParams()
  const buyOrder = searchParams.get("orderId")

  const [voucherToken, setVoucherToken] = useState<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    setVoucherToken(sessionStorage.getItem("jc_voucher_token"))
    setTokenReady(true)
  }, [])

  const { data: voucher, isLoading: isVoucherLoading, isError: isVoucherError } = useQuery({
    queryKey: ["webpay-voucher", buyOrder, voucherToken],
    queryFn: () => getWebpayVoucherByBuyOrder(buyOrder!, voucherToken ?? undefined),
    enabled: !!buyOrder && tokenReady,
  })

  const { data: booking, isLoading: isBookingLoading, isError: isBookingError } = useQuery({
    queryKey: ["booking", voucher?.bookingId, voucherToken],
    queryFn: () => getBooking(voucher!.bookingId, voucherToken ?? undefined),
    enabled: !!voucher?.authorized && !!voucher?.bookingId && tokenReady,
  })

  // Conversión de GA4: se dispara sólo con el pago autorizado por Transbank y la
  // reserva ya cargada (de ahí salen hotel y comisión).
  useEffect(() => {
    if (!voucher?.authorized || !booking) return
    pushPurchaseEvent({
      transactionId: voucher.buyOrder,
      value: booking.pricing.feeAmount,
      hotelId: booking.hotel.id,
      hotelName: booking.hotel.name,
    })
  }, [voucher, booking])

  if (!buyOrder || isVoucherError) {
    return <FallbackScreen message="No pudimos cargar los datos de tu pago." />
  }

  if (isVoucherLoading || !voucher) {
    return <FallbackScreen message="Confirmando tu transacción..." tone="neutral" />
  }

  if (!voucher.authorized) {
    return <FallbackScreen message="Tu pago todavía no se pudo confirmar. Si el problema persiste, contáctanos." />
  }

  if (isBookingError) {
    return <FallbackScreen message="No pudimos cargar los datos de tu reserva." />
  }

  if (isBookingLoading || !booking) {
    return <FallbackScreen message="Confirmando tu transacción..." tone="neutral" />
  }

  const petNames = formatPetNames(booking.pets.map((p) => p.name))
  const checkinDate = new Date(`${booking.checkinDate}T12:00:00`)
  const checkoutDate = new Date(`${booking.checkoutDate}T12:00:00`)
  const nights = Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000)
  const checkinFormatted = formatDate(booking.checkinDate)
  const checkoutFormatted = formatDate(booking.checkoutDate)
  const { totalAmount, paidAmount, pendingAmount } = voucher.amounts
  // Con transporte el 30/70 deja de aplicar sobre el total, así que los porcentajes no se muestran.
  const showPercentages = !booking.transport.included
  const serviceDescription = `Pago por adelanto de reserva de alojamiento en hotel ${booking.hotel.name} desde el ${checkinFormatted} hasta el ${checkoutFormatted}`
  const transactionDateFormatted = voucher.transactionDate
    ? format(new Date(voucher.transactionDate), "d MMM yyyy, HH:mm", { locale: es })
    : "—"

  const handleDownloadVoucher = () => {
    window.open(getWebpayVoucherPdfUrl(voucher.buyOrder, voucherToken ?? undefined), "_blank")
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
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
              <div className="w-full pt-2 sm:pt-4">
                <h1 className="text-2xl md:text-3xl font-bold mb-0" style={{ color: "#0A1830" }}>
                  Felicitaciones!
                </h1>
                <p className="text-base md:text-lg" style={{ color: "#555" }}>
                  Hemos generado una nueva reserva al hotel
                </p>
              </div>

              {/* Payment voucher — Transbank required fields */}
              <div className="rounded-2xl p-4 border mt-3" style={{ backgroundColor: "#FAFAFA", borderColor: "#E5E7EB" }}>
                <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#0A1830" }}>
                  <ReceiptText size={18} style={{ color: "#0A1830" }} />
                  Comprobante de pago
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Comercio</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{MERCHANT_NAME}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>N° de orden</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{voucher.buyOrder}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Monto pagado</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{formatClp(voucher.amount)} CLP</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Código de autorización</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{voucher.authorizationCode ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Fecha de la transacción</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{transactionDateFormatted}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tipo de pago</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{paymentTypeLabel(voucher.paymentTypeCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Cuotas</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{installmentsLabel(voucher.installmentsNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tarjeta</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{voucher.cardLastFourDigits ? `**** ${voucher.cardLastFourDigits}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Descripción</p>
                    <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{serviceDescription}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadVoucher}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs border-2 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#0A1830", color: "#0A1830" }}
                >
                  <Download size={14} />
                  Descargar comprobante
                </button>
              </div>

              {/* Next step — hotel confirmation */}
              <div className="rounded-2xl p-4 border mt-3 mb-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#FFE8A3" }}>
                <h2 className="text-base font-bold mb-2 flex items-center gap-2" style={{ color: "#0A1830" }}>
                  <Info size={18} style={{ color: "#C77700" }} />
                  Siguiente paso: Confirmación de hotel
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                  Para garantizar la seguridad de tu peludito y la de todas las mascotas hospedadas, el hotel revisará
                  ahora los datos y documentos que nos compartiste. Este paso nos permite confirmar tu reserva con total
                  tranquilidad. Lo harán lo antes posible y te avisaremos por email y en los estados de tu reserva apenas
                  esté listo.
                </p>
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
                    <li className="flex items-center gap-2 text-base font-semibold" style={{ color: "#0A1830" }}>
                      <Calendar size={18} style={{ color: "#0A1830" }} />
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
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Total Alojamiento{showPercentages ? " (100%)" : ""}</p>
                        <p className="mt-1 text-xs" style={{ color: "#667085" }}>Monto total de tu reserva</p>
                        <p className="mt-5 text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(totalAmount)}</p>
                        <p className="mt-1 text-xs" style={{ color: "#8A94A6" }}>IVA incluido</p>
                      </div>

                      <div className="hidden md:flex items-center justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: "#F3F4F6", color: "#0A1830" }}>
                          =
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl p-3 border shadow-sm md:p-4" style={{ backgroundColor: "#EEF8F2", borderColor: "#BBE6CD" }}>
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Monto abonado{showPercentages ? " (30%)" : ""}</p>
                        <p className="mt-1 text-xs" style={{ color: "#667085" }}>Pagado en Jackcity</p>
                        <p className="mt-5 text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(paidAmount)}</p>
                        <p className="mt-1 text-xs" style={{ color: "#8A94A6" }}>IVA incluido</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold" style={{ backgroundColor: "#D5F1E2", color: "#15803D" }}>
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
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Pendiente en el hotel{showPercentages ? " (70%)" : ""}</p>
                        <p className="mt-1 text-xs" style={{ color: "#667085" }}>Abona directamente al hotel</p>
                        <p className="mt-5 text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(pendingAmount)}</p>
                        <p className="mt-1 text-xs" style={{ color: "#8A94A6" }}>IVA incluido</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold" style={{ backgroundColor: "#DCEBFF", color: "#2563EB" }}>
                          <Building2 size={13} />
                          Se paga al hotel
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation policy — la fecha sin costo sólo aplica a la política FLEXIBLE.
                  En STRICT (por tramos) no hay ventana gratuita, así que la card no se muestra. */}
              {booking.cancellationPolicy === CANCELLATION_POLICY_FLEXIBLE && (
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                        La cancelacion de esta reserva la puedes realizar sin costo hasta el <strong>{formatDate(booking.freeCancellationDeadline)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function BookingConfirmationSuccessPage() {
  return (
    <Suspense>
      <BookingConfirmationSuccessContent />
    </Suspense>
  )
}
