"use client"

import { useState, Suspense } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatClp } from "@/lib/format"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import { CancellationPolicySection } from "@/components/cancellation-policy"
import { getHotelBookingDetail } from "@/lib/api/hotel-detail"
import { createQuote } from "@/lib/api/quotes"
import { PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"
import { parsePetBreedsParam, parsePetIdsParam } from "@/lib/search-pets"
import { useApiClient } from "@/hooks/use-api-client"
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  Star,
} from "lucide-react"
import { LoadingPaws } from "@/components/loading-paws"
import type { HotelDetail } from "@/lib/api/hotel-detail"
import { slotTime } from "@/lib/transport-slots"

const CITY_LABELS: Record<string, string> = {
  SANTIAGO: "Santiago de Chile",
  CON: "Concepción",
  VAL: "Valparaíso",
  VDM: "Viña del Mar",
}

// Se usa mientras carga el detalle y si el hotel no tiene fotos cargadas.
const GALLERY_FALLBACK_IMAGE = "/images/hotel-patitas-inn.jpg"

// Recorrido mínimo del dedo para cambiar de foto (mismo umbral que JackStoryCarousel).
const SWIPE_THRESHOLD_PX = 50

function getScoreLabel(score: number): string {
  if (score >= 9.5) return "Excepcional"
  if (score >= 9.0) return "Fantástico"
  if (score >= 8.5) return "Fabuloso"
  if (score >= 8.0) return "Muy bien"
  if (score >= 7.0) return "Bien"
  if (score >= 6.0) return "Agradable"
  return "Aceptable"
}

/**
 * Nota y reseña destacada del hotel. Sin evaluaciones (avgRating null o 0) se
 * muestra como hotel nuevo en vez de una nota 0,0.
 */
function ScoreCard({
  hotel,
  score,
  className = "",
}: {
  hotel: HotelDetail
  score: number | null
  className?: string
}) {
  const hasScore = score != null && score > 0

  return (
    <div className={`bg-white rounded-2xl p-4 border ${className}`} style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-3">
        {hasScore ? (
          <div className="flex items-center justify-center px-3 py-2 rounded-lg text-white font-bold text-xl" style={{ backgroundColor: "#1a6b4a" }}>
            {score.toFixed(1).replace(".", ",")}
          </div>
        ) : (
          <div className="flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1a6b4a" }}>
            <Star size={22} fill="#FFFFFF" strokeWidth={0} aria-hidden="true" />
          </div>
        )}
        <div>
          <p className="font-semibold" style={{ color: "#0A1830" }}>
            {hasScore ? getScoreLabel(score) : "Nuevo en JackCity"}
          </p>
          {hasScore && (
            <p className="text-sm" style={{ color: "#555" }}>
              {hotel.reviewsCount ?? 0} comentarios
            </p>
          )}
        </div>
      </div>
      {hotel.reviewText && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-sm italic leading-relaxed mb-2" style={{ color: "#333" }}>
            &quot;{hotel.reviewText}&quot;
          </p>
          {hotel.reviewUserName && (
            <p className="text-xs font-semibold" style={{ color: "#555" }}>
              - {hotel.reviewUserName}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function HotelDetailContent() {
  const router = useRouter()
  const { id: hotelId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { apiFetch } = useApiClient()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState(false)

  const cityParam = searchParams.get("city") ?? "SANTIAGO"
  const checkinParam = searchParams.get("checkin") ?? ""
  const checkoutParam = searchParams.get("checkout") ?? ""
  const petsParam = searchParams.get("pets") ?? "SMALL"
  const breedsParam = searchParams.get("breeds") ?? ""
  const transportParam = searchParams.get("transport") === "true"
  const transportByParam = searchParams.get("transportBy") ?? undefined
  const communeCodeParam = searchParams.get("communeCode") ?? ""
  const communeParam = searchParams.get("commune") ?? ""
  const searchIdParam = searchParams.get("searchId") ?? ""
  const listIndexParam = parseInt(searchParams.get("listIndex") ?? "0", 10)

  const petSizes = petsParam.split(",") as PetSize[]
  const petBreeds = parsePetBreedsParam(breedsParam)
  const petIdsParam = searchParams.get("petIds") ?? ""
  const petIds = parsePetIdsParam(petIdsParam)
  const petsPayload = petSizes.map((size, i) => ({
    id: petIds[i] ?? null,
    breed: petBreeds[i] ?? "",
    size,
  }))

  const checkinDate = checkinParam ? new Date(`${checkinParam}T12:00:00`) : null
  const checkoutDate = checkoutParam ? new Date(`${checkoutParam}T12:00:00`) : null
  const nights = checkinDate && checkoutDate
    ? Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000)
    : 1

  const summaryData = {
    city: CITY_LABELS[cityParam] ?? cityParam,
    dateFrom: checkinDate ? format(checkinDate, "d MMM", { locale: es }) : "—",
    dateTo: checkoutDate ? format(checkoutDate, "d MMM", { locale: es }) : "—",
    petCount: petSizes.length,
    withTransport: transportParam,
  }

  const { data: hotel, isLoading, isError } = useQuery({
    queryKey: ["hotel-detail", hotelId, cityParam, checkinParam, checkoutParam, petsParam, transportParam, transportByParam, communeCodeParam, searchIdParam, listIndexParam],
    queryFn: () => getHotelBookingDetail({
      hotelId,
      city: cityParam,
      pets: petsPayload,
      checkinDate: checkinParam,
      checkoutDate: checkoutParam,
      needsTransport: transportParam,
      transportBy: transportByParam,
      transportCommune: transportParam ? communeCodeParam : undefined,
      searchId: searchIdParam,
      listIndex: listIndexParam,
      apiFetch,
    }),
    enabled: !!hotelId && !!checkinParam && !!checkoutParam && !!searchIdParam,
  })

  const photos = hotel?.photos ?? []
  // El índice puede quedar fuera de rango si cambia el hotel o su galería
  // (la query se refetchea al cambiar fechas/mascotas); se acota al mostrar.
  const photoIndex = currentImageIndex < photos.length ? currentImageIndex : 0
  const currentPhoto = photos[photoIndex] ?? null

  const score = hotel?.avgRating ?? null
  const totalPrice = hotel?.pricing?.totalPrice ?? 0
  const payNowPrice = hotel?.pricing?.payNowAmount ?? 0
  const lodgingPrice = hotel?.pricing?.bookingPrice ?? 0
  const transportPrice = hotel?.pricing?.transportPrice ?? 0
  const hasTransportPrice = transportPrice > 0

  // Avanzan desde photoIndex (el índice realmente visible) y no desde currentImageIndex,
  // que puede haber quedado fuera de rango si la galería cambió.
  const nextImage = () => setCurrentImageIndex((photoIndex + 1) % photos.length)
  const prevImage = () => setCurrentImageIndex((photoIndex - 1 + photos.length) % photos.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    setTouchStart(null)
    if (photos.length < 2) return

    const deltaX = e.changedTouches[0].clientX - touchStart.x
    const deltaY = e.changedTouches[0].clientY - touchStart.y
    // Sólo se toma como swipe si el gesto fue más horizontal que vertical:
    // de lo contrario el usuario estaba haciendo scroll de la página sobre la foto.
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaX < 0 ? nextImage() : prevImage()
    }
  }

  const backParams = new URLSearchParams({
    city: cityParam,
    checkin: checkinParam,
    checkout: checkoutParam,
    pets: petsParam,
    ...(breedsParam && { breeds: breedsParam }),
    ...(petIdsParam && { petIds: petIdsParam }),
    transport: String(transportParam),
    ...(transportParam && communeCodeParam && { communeCode: communeCodeParam }),
    ...(transportParam && communeParam && { commune: communeParam }),
  })
  const backUrl = `/booking/search?${backParams.toString()}`
  const landingUrl = `/?${backParams.toString()}`

  const handleReservar = async () => {
    setIsCreatingQuote(true)
    setQuoteError(false)
    try {
      const quote = await createQuote({
        hotelId,
        city: cityParam,
        pets: petsPayload,
        checkinDate: checkinParam,
        checkoutDate: checkoutParam,
        needsTransport: transportParam,
        transportBy: transportByParam,
        transportCommune: transportParam ? communeCodeParam : undefined,
        searchHotelId: hotel?.searchHotelId ?? null,
        listIndex: listIndexParam,
        apiFetch,
      })
      router.push(`/booking/confirmation/${quote.quoteId}`)
    } catch {
      setQuoteError(true)
      setIsCreatingQuote(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <SearchSummaryBar
          data={summaryData}
          onChangeClick={() => router.push(landingUrl)}
        />

        <div className="w-full px-4 pt-4 pb-[300px] md:px-6 md:pt-6 md:pb-[300px]">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => router.push(backUrl)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: "#0A1830", color: "#0A1830" }}
            >
              <ChevronLeft size={16} />
              Volver a la lista de hoteles
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div
              className="flex items-center gap-3 rounded-2xl border px-5 py-6 text-sm font-medium"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#D9E0EA", color: "#0A1830" }}
            >
              <span>Cargando detalle del hotel...</span>
              <LoadingPaws />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="rounded-2xl border px-5 py-6 text-sm font-medium" style={{ backgroundColor: "#FFFFFF", borderColor: "#F3C1C1", color: "#8A1C1C" }}>
              No pudimos cargar el detalle del hotel. Intenta nuevamente.
            </div>
          )}

          {/* Content — shown once loaded */}
          {!isLoading && !isError && (
            <>
              {/* Hotel name and location */}
              <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "#0A1830" }}>
                  {hotel?.name ?? ""}
                </h1>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} style={{ color: "#6B7280" }} />
                  <span className="text-sm" style={{ color: "#6B7280" }}>
                    {[hotel?.addressStreet, hotel?.commune].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              </div>

              {/* Two column layout */}
              <div className="flex flex-col lg:flex-row gap-4">

                {/* Left column */}
                <div className="flex flex-col gap-4 lg:w-3/4">

                  {/* 1. Photo Gallery */}
                  <div className="order-1 bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                    <div
                      className="relative aspect-[3/2] w-full select-none overflow-hidden"
                      style={{ backgroundColor: "#F3F4F6" }}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Fondo: la misma foto ampliada y difuminada, para que las franjas que
                          deja object-contain no queden vacías. Mismo src y sizes que la foto
                          principal, así el navegador reutiliza el archivo ya descargado. */}
                      <Image
                        src={currentPhoto?.url ?? GALLERY_FALLBACK_IMAGE}
                        alt=""
                        fill
                        aria-hidden="true"
                        className="object-cover scale-125 blur-2xl"
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        draggable={false}
                      />
                      <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,24,48,0.28)" }} aria-hidden="true" />

                      {/* La foto se ajusta al alto del marco y se ve completa: las verticales
                          dejan franjas a los lados en vez de recortarse. */}
                      <Image
                        src={currentPhoto?.url ?? GALLERY_FALLBACK_IMAGE}
                        alt={currentPhoto?.caption ?? hotel?.name ?? "Hotel"}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        priority
                        draggable={false}
                      />
                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            aria-label="Foto anterior"
                          >
                            <ChevronLeft size={24} style={{ color: "#0A1830" }} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            aria-label="Siguiente foto"
                          >
                            <ChevronRight size={24} style={{ color: "#0A1830" }} />
                          </button>
                          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                            {photoIndex + 1} / {photos.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 2. Score — mobile only */}
                  {hotel && <ScoreCard hotel={hotel} score={score} className="order-2 lg:hidden" />}

                  {/* 3. Highlights */}
                  {hotel && hotel.benefits?.length > 0 && (
                    <div className="order-3 lg:order-2 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                      <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>¿Por qué elegir este hotel?</h2>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {hotel.benefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#333" }}>
                            <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                            {b.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. Description */}
                  {hotel?.description && (
                    <div className="order-4 lg:order-3 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                      <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Descripción del Hotel</h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#333" }}>
                        {hotel.description}
                      </p>
                    </div>
                  )}

                  {/* 5. Conditions */}
                  {hotel && (hotel.policies?.length > 0 || (!transportParam && (hotel.checkinTime || hotel.checkoutTime))) && (
                    <div className="order-5 lg:order-4 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                      <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Condiciones del Hotel</h2>
                      {hotel.policies?.length > 0 && (
                        <ul className="flex flex-col gap-2 mb-4">
                          {hotel.policies.map((policy, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm" style={{ color: "#333" }}>
                              <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                              {policy.description}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!transportParam && (hotel.checkinTime || hotel.checkoutTime) && (
                        <div className="flex gap-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                          {hotel.checkinTime && (
                            <div className="flex items-start gap-2">
                              <Clock size={16} style={{ color: "#0A1830", flexShrink: 0, marginTop: 2 }} />
                              <div>
                                <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-in</p>
                                <p className="text-sm whitespace-pre-line" style={{ color: "#555" }}>{hotel.checkinTime}</p>
                              </div>
                            </div>
                          )}
                          {hotel.checkoutTime && (
                            <div className="flex items-start gap-2">
                              <Clock size={16} style={{ color: "#0A1830", flexShrink: 0, marginTop: 2 }} />
                              <div>
                                <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-out</p>
                                <p className="text-sm whitespace-pre-line" style={{ color: "#555" }}>{hotel.checkoutTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Transport Schedules (only when needsTransport) */}
                  {transportParam && hotel?.transport && (
                    hotel.transport.departureSlots.length > 0 || hotel.transport.returnSlots.length > 0
                  ) && (
                    <div className="order-6 lg:order-5 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                      <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                        Horarios disponibles para el transporte de tu mascota
                      </h2>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {hotel.transport.departureSlots.length > 0 && (
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Ida</p>
                            <div className="flex flex-col gap-2">
                              {hotel.transport.departureSlots.map((slot) => (
                                <div
                                  key={`dep-${slot}`}
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm"
                                  style={{ borderColor: "#E5E7EB", color: "#0A1830", backgroundColor: "#fff" }}
                                >
                                  <Clock size={14} style={{ color: "#0A1830", flexShrink: 0 }} />
                                  {slotTime(slot)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {hotel.transport.returnSlots.length > 0 && (
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Regreso</p>
                            <div className="flex flex-col gap-2">
                              {hotel.transport.returnSlots.map((slot) => (
                                <div
                                  key={`ret-${slot}`}
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm"
                                  style={{ borderColor: "#E5E7EB", color: "#0A1830", backgroundColor: "#fff" }}
                                >
                                  <Clock size={14} style={{ color: "#0A1830", flexShrink: 0 }} />
                                  {slotTime(slot)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-sm" style={{ color: "#6B7280" }}>
                        Podrás seleccionar el horario de tu reserva en el siguiente paso.
                      </p>
                    </div>
                  )}

                  {/* 6. Cancellation Policy */}
                  {hotel?.cancellationPolicy && (
                    <CancellationPolicySection
                      policy={hotel.cancellationPolicy}
                      className="order-7 lg:order-6"
                    />
                  )}

                  {/* 7. Reservation Summary */}
                  <div className="order-8 lg:order-7 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Resumen de Reserva</h2>
                        <ul className="flex flex-col gap-1 text-sm" style={{ color: "#555" }}>
                          <li>
                            {petSizes.length} {petSizes.length === 1 ? "mascota" : "mascotas"},{" "}
                            {petSizes.map((s) => PET_SIZE_LABEL[s] ?? s).join(", ")}
                          </li>
                          <li>{nights} {nights === 1 ? "noche" : "noches"}</li>
                          {transportParam && <li>Transporte incluido</li>}
                        </ul>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1">
                        {/* Con transporte el precio se desglosa: alojamiento y transporte por separado,
                            y el monto grande de abajo sigue siendo el total de la reserva. */}
                        {hasTransportPrice && (
                          <div className="flex flex-col sm:items-end gap-0.5 text-xs" style={{ color: "#555" }}>
                            <p>Alojamiento: {formatClp(lodgingPrice)}</p>
                            <p>Transporte: {formatClp(transportPrice)}</p>
                          </div>
                        )}
                        <p className="text-2xl md:text-3xl font-bold" style={{ color: "#0A1830" }}>
                          {formatClp(totalPrice)}
                        </p>
                        {hasTransportPrice && (
                          <p className="text-xs" style={{ color: "#888" }}>Valor del transporte incluido</p>
                        )}
                        <p className="text-xs" style={{ color: "#888" }}>IVA incluido</p>
                        <p className="mt-1 rounded-lg px-3 py-2 text-xs font-bold leading-snug sm:whitespace-nowrap sm:text-right" style={{ backgroundColor: "#FFF7D6", color: "#0A1830" }}>
                          {hasTransportPrice
                            ? `Reserva ahora pagando un abono de ${formatClp(payNowPrice)}`
                            : `Reserva ahora pagando el 30% por ${formatClp(payNowPrice)}`}
                        </p>
                      </div>
                    </div>

                    {quoteError && (
                      <p className="mt-3 text-sm text-center" style={{ color: "#8A1C1C" }}>
                        No pudimos procesar la reserva. Intenta nuevamente.
                      </p>
                    )}
                    <button
                      onClick={handleReservar}
                      disabled={isCreatingQuote}
                      className="w-full mt-4 py-3.5 rounded-xl font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
                    >
                      {isCreatingQuote ? "Procesando..." : "Reservar"}
                    </button>
                  </div>
                </div>

                {/* Right column — desktop only */}
                <div className="hidden lg:flex flex-col gap-4 lg:w-1/4">

                  {hotel && <ScoreCard hotel={hotel} score={score} />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function HotelDetailPage() {
  return (
    <Suspense>
      <HotelDetailContent />
    </Suspense>
  )
}
