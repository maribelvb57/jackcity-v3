"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { formatClp } from "@/lib/format"
import { createQuote } from "@/lib/api/quotes"
import { useApiClient } from "@/hooks/use-api-client"
import { PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"
import type { AvailabilitySearch, HotelAvailability } from "@/lib/api/availability"

/** Noches entre check-in y check-out, ambas en formato yyyy-MM-dd. */
function nightsBetween(checkinDate: string, checkoutDate: string): number {
  const from = new Date(`${checkinDate}T12:00:00`)
  const to = new Date(`${checkoutDate}T12:00:00`)
  const nights = Math.round((to.getTime() - from.getTime()) / 86400000)
  return nights > 0 ? nights : 1
}

/**
 * Resumen de la reserva cuando el hotel sí tiene disponibilidad. Reemplaza al
 * buscador y muestra el mismo desglose que la ficha de booking/hotel.
 */
export function HotelBookingSummary({
  search,
  availability,
  onModifySearch,
  cardColor,
  cardBorder,
}: {
  search: AvailabilitySearch
  availability: HotelAvailability
  onModifySearch: () => void
  cardColor: string
  cardBorder: string
}) {
  const router = useRouter()
  const { apiFetch } = useApiClient()
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState(false)

  const nights = nightsBetween(search.checkinDate, search.checkoutDate)
  const petSizes = search.pets.map((p) => p.size as PetSize)

  const totalPrice = availability.pricing?.totalPrice ?? 0
  const payNowPrice = availability.pricing?.payNowAmount ?? 0
  const housingPrice = availability.pricing?.housingPrice ?? 0
  const transportPrice = availability.pricing?.transportPrice ?? 0
  const hasTransportPrice = transportPrice > 0

  const provider = availability.transport?.provider
  const transportLabel = `Transporte incluido${
    provider === "HOTEL" ? " por el hotel" : provider === "JACKCITY" ? " por JackCity" : ""
  }`

  const handleReservar = async () => {
    setIsCreatingQuote(true)
    setQuoteError(false)
    try {
      const quote = await createQuote({
        hotelId: availability.hotelId,
        city: search.city,
        pets: search.pets,
        checkinDate: search.checkinDate,
        checkoutDate: search.checkoutDate,
        needsTransport: search.needsTransport,
        ...(search.needsTransport && provider && { transportBy: provider }),
        ...(search.needsTransport && search.transportCommune && { transportCommune: search.transportCommune }),
        searchHotelId: availability.searchHotelId ?? null,
        // Esta búsqueda no viene de un listado de resultados: no hay posición que informar.
        listIndex: -1,
        apiFetch,
      })
      router.push(`/booking/confirmation/${quote.quoteId}`)
    } catch {
      setQuoteError(true)
      setIsCreatingQuote(false)
    }
  }

  return (
    <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardColor, borderColor: cardBorder }}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Resumen de Reserva</h2>
          <ul className="flex flex-col gap-1 text-sm" style={{ color: "#4A5A70" }}>
            <li>
              {petSizes.length} {petSizes.length === 1 ? "mascota" : "mascotas"},{" "}
              {petSizes.map((s) => PET_SIZE_LABEL[s] ?? s).join(", ")}
            </li>
            <li>{nights} {nights === 1 ? "noche" : "noches"}</li>
            {search.needsTransport && <li>{transportLabel}</li>}
          </ul>
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          {/* Con transporte el precio se desglosa: alojamiento y transporte por separado,
              y el monto grande de abajo sigue siendo el total de la reserva. */}
          {hasTransportPrice && (
            <div className="flex flex-col sm:items-end gap-0.5 text-xs" style={{ color: "#4A5A70" }}>
              <p>Alojamiento: {formatClp(housingPrice)}</p>
              <p>Transporte: {formatClp(transportPrice)}</p>
            </div>
          )}
          <p className="text-2xl md:text-3xl font-bold" style={{ color: "#0A1830" }}>
            {formatClp(totalPrice)}
          </p>
          {hasTransportPrice && (
            <p className="text-xs" style={{ color: "#6B7280" }}>Valor del transporte incluido</p>
          )}
          <p className="text-xs" style={{ color: "#6B7280" }}>IVA incluido</p>
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
        type="button"
        onClick={handleReservar}
        disabled={isCreatingQuote}
        className="w-full mt-4 py-3.5 rounded-xl font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
      >
        {isCreatingQuote ? "Procesando..." : "Reservar"}
      </button>

      <button
        type="button"
        onClick={onModifySearch}
        className="mt-3 flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: "#28548f" }}
      >
        <ChevronLeft size={16} />
        Modificar búsqueda
      </button>
    </div>
  )
}
