"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { AvailabilityCalendarMobile } from "./availability-calendar-mobile"
import { useApiClient } from "@/hooks/use-api-client"

// ─── Change Info Type ─────────────────────────────────────────────────────────

interface DayChange {
  day: number
  oldCapacity: number
  newCapacity: number
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateAvailability {
  bookings: number
  capacity: number
  available: number
}

interface HotelAvailability {
  hotelId: number
  monthId: string
  dates: Record<string, DateAvailability>  // keys: "2026-07-01", "2026-07-02", …
}

interface DayData {
  date: number
  booked: number      // comes from backend – not editable
  capacity: number    // editable by the user
  dispo: number       // comes from backend – not editable
}

interface CalendarState {
  year: number
  month: number // 0-indexed
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

/** Returns day-of-week index for the 1st of the month where Monday = 0 */
function firstDayOfMonth(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay() // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1              // convert to Mon=0 … Sun=6
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Convert API response to DayData format */
function apiToDayData(apiData: HotelAvailability): Record<number, DayData> {
  const data: Record<number, DayData> = {}
  for (const [dateStr, dateInfo] of Object.entries(apiData.dates)) {
    const day = parseInt(dateStr.split("-")[2], 10)  // "2026-07-01" → 1
    data[day] = {
      date: day,
      booked: dateInfo.bookings,
      capacity: dateInfo.capacity,
      dispo: dateInfo.available,
    }
  }
  return data
}

/** Format month to API monthId format (e.g., "2026-05") */
function formatMonthId(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number | null
  data: DayData | undefined
  onCapacityChange: (day: number, value: string) => void
  isPast: boolean
}

function DayCell({ day, data, onCapacityChange, isPast }: DayCellProps) {
  // Empty/shaded cell (outside the current month)
  if (day === null) {
    return (
      <td
        className="border border-gray-300 bg-gray-100 relative"
        style={{ minHeight: 89, height: 89 }}
        aria-hidden="true"
      >
        {/* diagonal hatch pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 1px, transparent 1px, transparent 8px)",
          }}
        />
      </td>
    )
  }

  return (
    <td
      className="border border-gray-300 bg-white relative p-1 align-top"
      style={{ minHeight: 89, height: 89, width: "14.28%" }}
    >
      {/* Date label – top right */}
      <div
        className="absolute top-0 right-0 min-w-[28px] h-7 flex items-center justify-center rounded-bl text-xs font-bold px-1.5"
        style={{ backgroundColor: "rgb(51 147 29)", color: "#ffffff" }}
      >
        {day}
      </div>

      {/* Booked / Capacity row */}
      <div className="flex items-center justify-center gap-0.5 mt-5">
        {/* booked – read only */}
        <span className="text-base font-bold" style={{ color: "#0D2B45" }}>
          {data?.booked ?? "-"}
        </span>
        <span className="text-base font-bold" style={{ color: "#0D2B45" }}>/</span>
        {/* capacity – editable for future days, read-only label for past days */}
        {isPast ? (
          <span className="text-base font-bold" style={{ color: "#0D2B45" }}>
            {data?.booked ?? "-"}
          </span>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={data?.capacity ?? ""}
            onChange={(e) => onCapacityChange(day, e.target.value.replace(/\D/g, ""))}
            className="w-9 text-center text-xs font-bold border border-gray-400 rounded focus:outline-none focus:ring-1"
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
      <div className="flex justify-center mt-1.5">
        <span className="text-xs" style={{ color: "#4B5563" }}>
          dispo:{" "}
          <span className="font-semibold" style={{ color: "#0D2B45" }}>
            {data?.dispo ?? "-"}
          </span>
        </span>
      </div>
    </td>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AvailabilityCalendarProps {
  hotelId: string
}

export function AvailabilityCalendar({ hotelId }: AvailabilityCalendarProps) {
  const today = new Date()
  const { apiFetch } = useApiClient()
  const [cal, setCal] = useState<CalendarState>({ year: today.getFullYear(), month: today.getMonth() })
  const [dayData, setDayData] = useState<Record<number, DayData>>({})
  const [originalData, setOriginalData] = useState<Record<number, DayData>>({})
  const [bulkCapacity, setBulkCapacity] = useState<string>("10")
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch availability data from API
  const fetchAvailability = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const monthId = formatMonthId(year, month)
      const data = await apiFetch<HotelAvailability>(`/api/hotel/availability/${hotelId}/${monthId}`)
      const converted = apiToDayData(data)
      setDayData(converted)
      setOriginalData(converted)
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }, [hotelId, apiFetch])

  // Fetch on mount and when month changes
  useEffect(() => {
    fetchAvailability(cal.year, cal.month)
  }, [cal.year, cal.month, fetchAvailability])

  // Navigation limits
  const MIN_YEAR = 2026
  const MIN_MONTH = 2 // Marzo (0-indexed)
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1)
  const MAX_YEAR = maxDate.getFullYear()
  const MAX_MONTH = maxDate.getMonth()

  const canGoPrev = cal.year > MIN_YEAR || (cal.year === MIN_YEAR && cal.month > MIN_MONTH)
  const canGoNext = cal.year < MAX_YEAR || (cal.year === MAX_YEAR && cal.month < MAX_MONTH)

  // Navigation
  function prevMonth() {
    if (!canGoPrev) return
    setCal((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function nextMonth() {
    if (!canGoNext) return
    setCal((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // Capacity edit
  function handleCapacityChange(day: number, value: string) {
    const parsed = parseInt(value, 10)
    const capacity = isNaN(parsed) ? 0 : Math.max(0, Math.min(99, parsed))
    setDayData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        capacity,
        dispo: capacity - (prev[day]?.booked ?? 0),
      },
    }))
  }

  // Bulk update
  function handleBulkUpdate() {
    const newCap = parseInt(bulkCapacity, 10)
    if (isNaN(newCap) || bulkCapacity === "") return
    const todayDate = today.getDate()
    const isCurrentMonth = cal.year === today.getFullYear() && cal.month === today.getMonth()
    setDayData((prev) => {
      const updated = { ...prev }
      for (let d = 1; d <= totalDays; d++) {
        if (isCurrentMonth && d < todayDate) continue
        const booked = updated[d]?.booked ?? 0
        updated[d] = {
          date: d,
          booked,
          capacity: newCap,
          dispo: newCap - booked,
        }
      }
      return updated
    })
  }

  // Get list of days that have been modified
  function getChangedDays(): DayChange[] {
    const changes: DayChange[] = []
    for (const dayStr of Object.keys(dayData)) {
      const day = parseInt(dayStr, 10)
      const current = dayData[day]
      const original = originalData[day]
      if (current && (!original || current.capacity !== original.capacity)) {
        changes.push({
          day,
          oldCapacity: original?.capacity ?? 0,
          newCapacity: current.capacity,
        })
      }
    }
    return changes.sort((a, b) => a.day - b.day)
  }

  // Handle save button click
  function handleSaveClick() {
    setSaveError(null)
    setShowSaveModal(true)
  }

  // Handle confirm save
  async function handleConfirmSave() {
    const changes = getChangedDays()
    if (changes.length === 0) return

    const monthId = formatMonthId(cal.year, cal.month)
    const dates: Record<string, { capacity: number }> = {}
    for (const { day, newCapacity } of changes) {
      if (isPastDay(day)) continue
      const dateKey = `${monthId}-${String(day).padStart(2, "0")}`
      dates[dateKey] = { capacity: newCapacity }
    }

    if (Object.keys(dates).length === 0) return

    setSaving(true)
    setSaveError(null)
    try {
      await apiFetch(`/api/hotel/availability/${hotelId}/${monthId}`, {
        method: "PUT",
        body: JSON.stringify({ hotelId, monthId, dates }),
      })
      setOriginalData({ ...dayData })
      setShowSaveModal(false)
    } catch {
      setSaveError("No se pudieron guardar los cambios. Intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel save
  function handleCancelSave() {
    if (saving) return
    setShowSaveModal(false)
  }

  // Determine if a given day in the current viewed month is in the past
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  function isPastDay(day: number): boolean {
    if (cal.year < todayYear) return true
    if (cal.year === todayYear && cal.month < todayMonth) return true
    if (cal.year === todayYear && cal.month === todayMonth && day < todayDate) return true
    return false
  }

  // Build calendar grid (6 rows × 7 cols)
  const firstDay = firstDayOfMonth(cal.year, cal.month)
  const totalDays = daysInMonth(cal.year, cal.month)

  // Flatten into 42 slots (6 weeks)
  const slots: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) slots.push(null)
  for (let d = 1; d <= totalDays; d++) slots.push(d)
  while (slots.length < 42) slots.push(null)

  const weeks: (number | null)[][] = []
  for (let w = 0; w < 6; w++) {
    const week = slots.slice(w * 7, w * 7 + 7)
    // Meses cortos dejan la última fila entera fuera del mes: no se muestra.
    if (week.every((day) => day === null)) continue
    weeks.push(week)
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 font-sans">

      {/* Desktop view */}
      <div className="hidden md:block">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            style={{ color: "#1a3a5c" }}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          <h1 className="text-3xl font-bold uppercase tracking-wider" style={{ color: "#0D2B45" }}>
            {MONTH_NAMES_ES[cal.month]} {cal.year}
          </h1>

          <button
            onClick={nextMonth}
            disabled={!canGoNext}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            style={{ color: "#1a3a5c" }}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Calendar table */}
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <div className="text-sm font-medium" style={{ color: "#0D2B45" }}>Cargando...</div>
            </div>
          )}
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                {DAY_NAMES_ES.map((name) => (
                  <th
                    key={name}
                    className="border border-gray-300 py-2 text-center text-sm font-semibold"
                    style={{ backgroundColor: "#4B5563", color: "#ffffff", width: "14.28%" }}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => (
                    <DayCell
                      key={`${wi}-${di}`}
                      day={day}
                      data={day !== null ? dayData[day] : undefined}
                      onCapacityChange={handleCapacityChange}
                      isPast={day !== null ? isPastDay(day) : false}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save button */}
        <div className="flex justify-center mt-6">
          <button
            className="px-10 py-3 rounded-lg text-base font-bold tracking-wide transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
            onClick={handleSaveClick}
          >
            Guardar cambios de este mes
          </button>
        </div>

        {/* Bulk update footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <span className="text-sm" style={{ color: "#4B5563" }}>
            Actualizar todas las disponibilidades futuras a
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bulkCapacity}
            onChange={(e) => setBulkCapacity(e.target.value.replace(/\D/g, ""))}
            className="w-16 text-center text-sm font-bold border-2 border-gray-400 rounded focus:outline-none focus:ring-2 py-1"
            style={{ color: "#0D2B45", ringColor: "#FFC43D" }}
            aria-label="Capacidad masiva"
          />
          <button
            onClick={handleBulkUpdate}
            className="px-5 py-1.5 rounded text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            Go!
          </button>
        </div>

        {/* Hotel ID note */}
        <p className="text-xs text-right mt-2" style={{ color: "#9CA3AF" }}>
          Hotel ID: {hotelId}
        </p>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <AvailabilityCalendarMobile
          monthName={MONTH_NAMES_ES[cal.month]}
          year={cal.year}
          dayData={dayData}
          loading={loading}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onCapacityChange={handleCapacityChange}
          isPastDay={isPastDay}
          totalDays={totalDays}
          bulkCapacity={bulkCapacity}
          onBulkCapacityChange={setBulkCapacity}
          onBulkUpdate={handleBulkUpdate}
          hotelId={hotelId}
          onSaveClick={handleSaveClick}
        />
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: "#1a3a5c" }}
            >
              <h2 className="text-lg font-bold text-white">
                Confirmar cambios
              </h2>
              <button
                onClick={handleCancelSave}
                className="text-white hover:opacity-70 transition-opacity"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
              {(() => {
                const changes = getChangedDays()
                if (changes.length === 0) {
                  return (
                    <p className="text-sm" style={{ color: "#4B5563" }}>
                      No hay cambios para guardar.
                    </p>
                  )
                }
                return (
                  <>
                    <p className="text-sm mb-4" style={{ color: "#4B5563" }}>
                      Los siguientes días serán actualizados:
                    </p>
                    <div className="space-y-2">
                      {changes.map(({ day, oldCapacity, newCapacity }) => (
                        <div
                          key={day}
                          className="flex items-center justify-between py-2 px-3 rounded"
                          style={{ backgroundColor: "#F3F4F6" }}
                        >
                          <span className="font-semibold" style={{ color: "#0D2B45" }}>
                            Día {day}
                          </span>
                          <span className="text-sm" style={{ color: "#4B5563" }}>
                            Capacidad: {oldCapacity} → <span className="font-bold" style={{ color: "rgb(51 147 29)" }}>{newCapacity}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <p className="text-sm mb-4" style={{ color: "#0D2B45" }}>
                ¿Desea guardar estos cambios de disponibilidad para el mes de{" "}
                <span className="font-bold">{MONTH_NAMES_ES[cal.month]} {cal.year}</span>?
              </p>
              {saveError && (
                <p className="text-sm mb-3 font-medium" style={{ color: "#9B1C1C" }}>
                  {saveError}
                </p>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelSave}
                  disabled={saving}
                  className="px-6 py-2 rounded text-sm font-bold border-2 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: "#9CA3AF", color: "#4B5563" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={getChangedDays().length === 0 || saving}
                  className="px-6 py-2 rounded text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#1a3a5c", color: "#ffffff" }}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
