"use client"

import { MapPin, Calendar, PawPrint, Car, ChevronDown } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { DateRangePickerPopover } from "@/components/date-range-picker-popover"
import { PetsPickerPopover } from "@/components/pets-picker-popover"
import type { Mascota } from "@/stores/search-store"

interface SearchSummaryData {
  city: string
  dateFrom: string
  dateTo: string
  petCount: number
  withTransport: boolean
}

interface SearchSummaryBarProps {
  data: SearchSummaryData
  /**
   * Los chips de fechas y mascotas se vuelven editables solo si llegan sus callbacks
   * (página de resultados). Sin ellos la barra queda informativa, que es lo que
   * necesitan la ficha de hotel y las páginas de confirmación.
   */
  dateRange?: DateRange
  mascotas?: Mascota[]
  onDatesChange?: (range: { from: Date; to: Date }) => void
  onPetsChange?: (mascotas: Mascota[]) => void
  /** Botón "Cambiar": solo se muestra donde se pase. */
  onChangeClick?: () => void
}

const CHIP_CLASS = "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
const CHIP_STYLE = { backgroundColor: "rgba(255,255,255,0.85)", color: "#0A1830" }
// Los chips accionables se distinguen del informativo por el borde y el chevron.
const ACTION_CHIP_CLASS = `${CHIP_CLASS} border transition-colors hover:bg-white`
const ACTION_CHIP_STYLE = { ...CHIP_STYLE, borderColor: "#0A1830", cursor: "pointer" }

export function SearchSummaryBar({
  data,
  dateRange,
  mascotas,
  onDatesChange,
  onPetsChange,
  onChangeClick,
}: SearchSummaryBarProps) {
  const datesLabel = (
    <>
      <Calendar size={12} />
      <span>{data.dateFrom} - {data.dateTo}</span>
    </>
  )
  const petsLabel = (
    <>
      <PawPrint size={12} />
      <span>{data.petCount} {data.petCount === 1 ? "mascota" : "mascotas"}</span>
    </>
  )

  return (
    <div className="w-full py-2 px-4" style={{ backgroundColor: "#FFC43D" }}>
      <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
        {/* Ciudad — siempre informativa: hoy solo operamos en Santiago. */}
        <div className={CHIP_CLASS} style={CHIP_STYLE}>
          <MapPin size={12} />
          <span>{data.city}</span>
        </div>

        {/* Fechas */}
        {onDatesChange ? (
          <DateRangePickerPopover value={dateRange} onApply={onDatesChange} className={ACTION_CHIP_CLASS} style={ACTION_CHIP_STYLE}>
            {datesLabel}
            <ChevronDown size={12} />
          </DateRangePickerPopover>
        ) : (
          <div className={CHIP_CLASS} style={CHIP_STYLE}>{datesLabel}</div>
        )}

        {/* Mascotas */}
        {onPetsChange ? (
          <PetsPickerPopover value={mascotas ?? []} onApply={onPetsChange} className={ACTION_CHIP_CLASS} style={ACTION_CHIP_STYLE}>
            {petsLabel}
            <ChevronDown size={12} />
          </PetsPickerPopover>
        ) : (
          <div className={CHIP_CLASS} style={CHIP_STYLE}>{petsLabel}</div>
        )}

        {/* Transporte — solo se muestra si la búsqueda lo incluye. */}
        {data.withTransport && (
          <div className={CHIP_CLASS} style={CHIP_STYLE}>
            <Car size={12} />
            <span>Transporte</span>
          </div>
        )}

        {onChangeClick && (
          <button
            onClick={onChangeClick}
            className="flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-colors hover:bg-white/20"
            style={{ borderColor: "#0A1830", color: "#0A1830", backgroundColor: "transparent" }}
          >
            Cambiar
          </button>
        )}
      </div>
    </div>
  )
}
