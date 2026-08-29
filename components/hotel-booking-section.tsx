"use client"

import { useState } from "react"
import Image from "next/image"
import { HotelSearchBar } from "@/components/hotel-search-bar"
import { HotelBookingSummary } from "@/components/hotel-booking-summary"
import type { AvailabilitySearch, HotelAvailability } from "@/lib/api/availability"

// Verde menta para el buscador; una vez elegida la reserva, el resumen pasa al
// gris claro que ya usan las cabeceras de los modales.
const SEARCH_CARD_COLOR = "#E8F6EF"
const SEARCH_CARD_BORDER = "#C6E4D6"
const SUMMARY_CARD_COLOR = "#F5F8FC"
const SUMMARY_CARD_BORDER = "#E5E7EB"

/**
 * Última sección de la ficha. Parte con el buscador y, cuando el hotel tiene
 * disponibilidad para lo buscado, lo reemplaza por el resumen de la reserva.
 * "Modificar búsqueda" devuelve al buscador con los datos como quedaron.
 */
export function HotelBookingSection({
  hotelKeyName,
  className = "",
}: {
  hotelKeyName: string
  className?: string
}) {
  const [result, setResult] = useState<{
    search: AvailabilitySearch
    availability: HotelAvailability
  } | null>(null)

  return (
    <div className={className}>
      {/* Jack completo, alineado a la derecha y justo encima de la tarjeta. */}
      <div className="flex justify-end pr-6 md:pr-10">
        <Image
          src="/images/jack/jack-003.png"
          alt=""
          aria-hidden="true"
          width={712}
          height={599}
          className="pointer-events-none select-none h-40 w-auto max-w-none md:h-44"
          draggable={false}
        />
      </div>

      {result ? (
        <HotelBookingSummary
          search={result.search}
          availability={result.availability}
          onModifySearch={() => setResult(null)}
          cardColor={SUMMARY_CARD_COLOR}
          cardBorder={SUMMARY_CARD_BORDER}
        />
      ) : (
        <HotelSearchBar
          hotelKeyName={hotelKeyName}
          onAvailable={(search, availability) => setResult({ search, availability })}
          cardColor={SEARCH_CARD_COLOR}
          cardBorder={SEARCH_CARD_BORDER}
        />
      )}

      {/* Aire al final de la página para que el calendario y el panel de mascotas
          se desplieguen completos: se abren hacia abajo y esta es la última
          sección. Va en los dos estados para que el alto de la página no cambie
          al pasar del buscador al resumen. */}
      <div className="h-[200px]" aria-hidden="true" />
    </div>
  )
}
