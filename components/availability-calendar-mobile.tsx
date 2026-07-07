"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  date: number
  booked: number
  capacity: number
  dispo: number
}

interface AvailabilityCalendarMobileProps {
  monthName: string
  year: number
  dayData: Record<number, DayData>
  loading: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onCapacityChange: (day: number, value: string) => void
  isPastDay: (day: number) => boolean
  totalDays: number
  bulkCapacity: string
  onBulkCapacityChange: (value: string) => void
  onBulkUpdate: () => void
  hotelId: string
  onSaveClick: () => void
}

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

// ─── Mobile Day Card ──────────────────────────────────────────────────────────

interface MobileDayCardProps {
  day: number
  data: DayData | undefined
  onCapacityChange: (day: number, value: string) => void
  isPast: boolean
}

function MobileDayCard({ day, data, onCapacityChange, isPast }: MobileDayCardProps) {
  return (
    <div
      className="border border-gray-300 rounded-lg p-4 bg-white flex flex-col"
      style={{ minHeight: 140 }}
    >
      {/* Date badge – top right */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="min-w-[32px] h-8 flex items-center justify-center rounded-bl text-sm font-bold"
          style={{ backgroundColor: "rgb(51 147 29)", color: "#ffffff" }}
        >
          {day}
        </div>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>
          {new Date(new Date().getFullYear(), new Date().getMonth() + (day > 15 ? 1 : 0), day).toLocaleDateString("es-ES", {
            weekday: "short",
          })}
        </span>
      </div>

      {/* Booked / Capacity row */}
      <div className="flex items-center justify-center gap-2 my-3">
        {/* booked – read only */}
        <span className="text-lg font-bold" style={{ color: "#0D2B45" }}>
          {data?.booked ?? "-"}
        </span>
        <span className="text-lg font-bold" style={{ color: "#0D2B45" }}>/</span>
        {/* capacity – editable for future days, read-only for past days */}
        {isPast ? (
          <span className="text-lg font-bold" style={{ color: "#0D2B45" }}>
            {data?.booked ?? "-"}
          </span>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data?.capacity ?? ""}
            onChange={(e) => onCapacityChange(day, e.target.value.replace(/\D/g, ""))}
            className="w-12 text-center text-sm font-bold border border-gray-400 rounded focus:outline-none focus:ring-1"
            style={{
              color: "#0D2B45",
              backgroundColor: "#FFFDE7",
              ringColor: "#FFC43D",
            }}
            aria-label={`Capacidad día ${day}`}
          />
        )}
      </div>

      {/* Dispo label – bottom */}
      <div className="text-xs text-center mt-auto" style={{ color: "#4B5563" }}>
        <span>dispo: </span>
        <span className="font-semibold" style={{ color: "#0D2B45" }}>
          {data?.dispo ?? "-"}
        </span>
      </div>
    </div>
  )
}

// ─── Mobile Calendar Component ────────────────────────────────────────────────

export function AvailabilityCalendarMobile({
  monthName,
  year,
  dayData,
  loading,
  canGoPrev,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  onCapacityChange,
  isPastDay,
  totalDays,
  bulkCapacity,
  onBulkCapacityChange,
  onBulkUpdate,
  hotelId,
  onSaveClick,
}: AvailabilityCalendarMobileProps) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          style={{ color: "#1a3a5c" }}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>

        <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ color: "#0D2B45" }}>
          {monthName} {year}
        </h1>

        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          style={{ color: "#1a3a5c" }}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="text-sm font-medium" style={{ color: "#0D2B45" }}>
            Cargando...
          </div>
        </div>
      )}

      {/* Grid of day cards (2 columns) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {days.map((day) => (
          <MobileDayCard
            key={day}
            day={day}
            data={dayData[day]}
            onCapacityChange={onCapacityChange}
            isPast={isPastDay(day)}
          />
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-center mb-6">
        <button
          className="w-full px-6 py-3 rounded-lg text-base font-bold tracking-wide transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          onClick={onSaveClick}
        >
          Guardar cambios de este mes
        </button>
      </div>

      {/* Bulk update footer */}
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
        <span className="text-sm" style={{ color: "#4B5563" }}>
          Actualizar todas las disponibilidades futuras a
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bulkCapacity}
            onChange={(e) => onBulkCapacityChange(e.target.value.replace(/\D/g, ""))}
            className="flex-1 text-center text-sm font-bold border-2 border-gray-400 rounded focus:outline-none focus:ring-2 py-2"
            style={{ color: "#0D2B45", ringColor: "#FFC43D" }}
            aria-label="Capacidad masiva"
          />
          <button
            onClick={onBulkUpdate}
            className="px-6 py-2 rounded text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            Go!
          </button>
        </div>
      </div>

      {/* Hotel ID note */}
      <p className="text-xs text-right mt-4" style={{ color: "#9CA3AF" }}>
        Hotel ID: {hotelId}
      </p>
    </div>
  )
}
