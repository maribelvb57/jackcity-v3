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
import { getHotelBookingDetail } from "@/lib/api/hotel-detail"
import { createQuote } from "@/lib/api/quotes"
import { PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"
import { parsePetBreedsParam, parsePetIdsParam } from "@/lib/search-pets"
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
} from "lucide-react"
import { slotTime } from "@/lib/transport-slots"

const CITY_LABELS: Record<string, string> = {
  SANTIAGO: "Santiago de Chile",
  CON: "Concepción",
  VAL: "Valparaíso",
  VDM: "Viña del Mar",
}

const PAY_NOW_PERCENTAGE = 0.3

function getScoreLabel(score: number): string {
  if (score >= 9.5) return "Excepcional"
  if (score >= 9.0) return "Fantástico"
  if (score >= 8.5) return "Fabuloso"
  if (score >= 8.0) return "Muy bien"
  if (score >= 7.0) return "Bien"
  if (score >= 6.0) return "Agradable"
  return "Aceptable"
}

function HotelDetailContent() {
  const router = useRouter()
  const { id: hotelId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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
    }),
    enabled: !!hotelId && !!checkinParam && !!checkoutParam && !!searchIdParam,
  })

  const images = [
    "/images/hotel-patitas-inn.jpg",
    "/images/hotel-huellitas.jpg",
    "/images/hotel-pet-lodge.jpg",
    "/images/hotel-casa-canina.jpg",
  ]

  const score = hotel?.avgRating ?? null
  const scoreLabel = score != null ? getScoreLabel(score) : "—"
  const totalPrice = hotel?.pricing?.totalPrice ?? 0
  const payNowPrice = Math.round(totalPrice * PAY_NOW_PERCENTAGE)
  const hasTransportPrice = (hotel?.pricing?.transportPrice ?? 0) > 0

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)

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
  const backUrl = `/search?${backParams.toString()}`
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
        searchId: searchIdParam,
        listIndex: listIndexParam,
      })
      router.push(`/confirmation/${quote.quoteId}`)
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
            <div className="rounded-2xl border px-5 py-6 text-sm font-medium" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9E0EA", color: "#0A1830" }}>
              Cargando detalle del hotel...
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
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={images[currentImageIndex]}
                        alt={hotel?.name ?? "Hotel"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 75vw"
                      />
                      {images.length > 1 && (
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
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 2. Score + Highlights — mobile only */}
                  {hotel && (
                    <div className="flex flex-col gap-4 order-2 lg:hidden">
                      {score != null && (
                        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center px-3 py-2 rounded-lg text-white font-bold text-xl" style={{ backgroundColor: "#1a6b4a" }}>
                              {score.toFixed(1).replace(".", ",")}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: "#0A1830" }}>{scoreLabel}</p>
                              <p className="text-sm" style={{ color: "#555" }}>{hotel.reviewsCount ?? 0} comentarios</p>
                            </div>
                          </div>
                          {hotel.reviewText && (
                            <div className="pt-3 border-t" style={{ borderColor: "#E5E7EB" }}>
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
                      )}

                      {hotel.benefits?.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                          <h3 className="text-sm font-bold mb-3" style={{ color: "#0A1830" }}>Puntos destacables</h3>
                          <ul className="flex flex-col gap-2">
                            {hotel.benefits.map((b, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#333" }}>
                                <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                                {b.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Description */}
                  {hotel?.description && (
                    <div className="order-3 lg:order-2 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                      <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Descripción del Hotel</h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#333" }}>
                        {hotel.description}
                      </p>
                    </div>
                  )}

                  {/* 4. Conditions */}
                  {hotel && (hotel.policies?.length > 0 || (!transportParam && (hotel.checkinTime || hotel.checkoutTime))) && (
                    <div className="order-4 lg:order-3 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
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
                            <div className="flex items-center gap-2">
                              <Clock size={16} style={{ color: "#0A1830" }} />
                              <div>
                                <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-in</p>
                                <p className="text-sm" style={{ color: "#555" }}>{hotel.checkinTime}</p>
                              </div>
                            </div>
                          )}
                          {hotel.checkoutTime && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} style={{ color: "#0A1830" }} />
                              <div>
                                <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-out</p>
                                <p className="text-sm" style={{ color: "#555" }}>{hotel.checkoutTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Transport Schedules (only when needsTransport) */}
                  {transportParam && hotel?.transport && (
                    hotel.transport.departureSlots.length > 0 || hotel.transport.returnSlots.length > 0
                  ) && (
                    <div className="order-5 lg:order-4 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
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

                  {/* 6. Reservation Summary */}
                  <div className="order-6 lg:order-5 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
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
                        <p className="text-3xl md:text-4xl font-bold" style={{ color: "#0A1830" }}>
                          {formatClp(totalPrice)}
                        </p>
                        {hasTransportPrice && (
                          <p className="text-xs" style={{ color: "#888" }}>Valor del transporte incluido</p>
                        )}
                        <p className="text-xs" style={{ color: "#888" }}>IVA incluido</p>
                        <p className="mt-1 rounded-lg px-3 py-2 text-xs font-bold leading-snug sm:whitespace-nowrap sm:text-right" style={{ backgroundColor: "#FFF7D6", color: "#0A1830" }}>
                          Reserva ahora pagando el 30% por {formatClp(payNowPrice)}
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

                  {hotel && score != null && (
                    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center px-3 py-2 rounded-lg text-white font-bold text-xl" style={{ backgroundColor: "#1a6b4a" }}>
                          {score.toFixed(1).replace(".", ",")}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: "#0A1830" }}>{scoreLabel}</p>
                          <p className="text-sm" style={{ color: "#555" }}>{hotel.reviewsCount ?? 0} comentarios</p>
                        </div>
                      </div>
                      {hotel.reviewText && (
                        <div className="pt-3 border-t" style={{ borderColor: "#E5E7EB" }}>
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
                  )}

                  {hotel && hotel.benefits?.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                      <h3 className="text-sm font-bold mb-3" style={{ color: "#0A1830" }}>Puntos destacables</h3>
                      <ul className="flex flex-col gap-2">
                        {hotel.benefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#333" }}>
                            <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                            {b.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
