"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { type Slot, type DayData, SLOTS, dispoColor } from "./transport-calendar"

interface TransportCalendarMobileProps {
  monthName: string
  year: number
  dayData: Record<number, DayData>
  loading: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onCapacityChange: (day: number, slot: Slot, value: string) => void
  isPastDay: (day: number) => boolean
  totalDays: number
  bulkCapacity: string
  onBulkCapacityChange: (value: string) => void
  bulkSlot: Slot
  onBulkSlotChange: (slot: Slot) => void
  onBulkUpdate: () => void
  hotelId: string
  onSaveClick: () => void
}

interface MobileDayCardProps {
  day: number
  data: DayData | undefined
  onCapacityChange: (day: number, slot: Slot, value: string) => void
  isPast: boolean
}

function MobileDayCard({ day, data, onCapacityChange, isPast }: MobileDayCardProps) {
  return (
    <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
      {/* Day badge row */}
      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
        <div
          className="min-w-[28px] h-7 flex items-center justify-center rounded text-sm font-bold px-1.5"
          style={{ backgroundColor: "rgb(51 147 29)", color: "#ffffff" }}
        >
          {day}
        </div>
        {/* slot headers */}
        <div className="grid grid-cols-3 flex-1 ml-3 text-center">
          {SLOTS.map((slot) => (
            <span key={slot} className="text-[10px] font-bold tracking-wide" style={{ color: "#9CA3AF" }}>{slot}</span>
          ))}
        </div>
      </div>

      {/* B row */}
      <div className="grid items-center px-3 py-1.5" style={{ gridTemplateColumns: "28px 1fr" }}>
        <span className="text-[10px] font-bold" style={{ color: "#9CA3AF" }}>B</span>
        <div className="grid grid-cols-3 text-center">
          {SLOTS.map((slot) => (
            <span key={slot} className="text-xs" style={{ color: "#6B7280" }}>
              {data?.slots[slot]?.bookings ?? "-"}
            </span>
          ))}
        </div>
      </div>

      {/* C row */}
      <div className="grid items-center px-3 py-1.5" style={{ gridTemplateColumns: "28px 1fr" }}>
        <span className="text-[10px] font-bold" style={{ color: "#9CA3AF" }}>C</span>
        <div className="grid grid-cols-3 gap-x-1 text-center">
          {SLOTS.map((slot) =>
            isPast ? (
              <span key={slot} className="text-xs font-bold" style={{ color: "#0D2B45" }}>
                {data?.slots[slot]?.capacity ?? "-"}
              </span>
            ) : (
              <input
                key={slot}
                type="text"
                inputMode="numeric"
                value={data?.slots[slot]?.capacity ?? ""}
                onChange={(e) => onCapacityChange(day, slot, e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-xs font-bold border border-gray-300 rounded focus:outline-none focus:border-yellow-400"
                style={{ color: "#0D2B45", backgroundColor: "#FFFDE7", minWidth: 0, padding: "2px 0" }}
                aria-label={`Capacidad ${slot} día ${day}`}
              />
            )
          )}
        </div>
      </div>

      {/* D row */}
      <div className="grid items-center px-3 py-1.5" style={{ gridTemplateColumns: "28px 1fr" }}>
        <span className="text-[10px] font-bold" style={{ color: "#9CA3AF" }}>D</span>
        <div className="grid grid-cols-3 text-center">
          {SLOTS.map((slot) => {
            const dispo = data?.slots[slot]?.dispo
            return (
              <span key={slot} className="text-xs font-bold" style={{ color: dispoColor(dispo) }}>
                {dispo ?? "-"}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function TransportCalendarMobile({
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
  bulkSlot,
  onBulkSlotChange,
  onBulkUpdate,
  hotelId,
  onSaveClick,
}: TransportCalendarMobileProps) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 font-sans">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} disabled={!canGoPrev}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "#1a3a5c" }} aria-label="Mes anterior">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ color: "#0D2B45" }}>
          {monthName} {year}
        </h1>
        <button onClick={onNextMonth} disabled={!canGoNext}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "#1a3a5c" }} aria-label="Mes siguiente">
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {[
          { label: "B", desc: "Reservas" },
          { label: "C", desc: "Capacidad" },
          { label: "D", desc: "Disponible" },
        ].map(({ label, desc }) => (
          <span key={label} className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
            <span className="font-bold px-1 py-0.5 rounded" style={{ backgroundColor: "#F3F4F6", color: "#0D2B45" }}>{label}</span>
            {desc}
          </span>
        ))}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="text-sm font-medium" style={{ color: "#0D2B45" }}>Cargando...</div>
        </div>
      )}

      {/* Day cards */}
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

      {/* Bulk update */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs mb-2 text-right" style={{ color: "#4B5563" }}>
          Establecer capacidad para días futuros:
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {SLOTS.map((slot) => (
            <label key={slot} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="radio"
                name="bulk-slot-mobile"
                value={slot}
                checked={bulkSlot === slot}
                onChange={() => onBulkSlotChange(slot)}
                className="w-4 h-4 cursor-pointer accent-[#1a3a5c]"
              />
              <span className="text-sm font-bold" style={{ color: "#0D2B45" }}>{slot}</span>
            </label>
          ))}
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={bulkCapacity}
            onChange={(e) => onBulkCapacityChange(e.target.value.replace(/\D/g, ""))}
            className="w-14 text-center text-sm font-bold border-2 border-gray-400 rounded focus:outline-none py-1.5"
            style={{ color: "#0D2B45" }}
            aria-label="Capacidad masiva"
          />
          <button onClick={onBulkUpdate}
            className="px-5 py-1.5 rounded text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}>
            Aplicar
          </button>
        </div>
      </div>

      <p className="text-xs text-right mt-4" style={{ color: "#9CA3AF" }}>Hotel ID: {hotelId}</p>
    </div>
  )
}
