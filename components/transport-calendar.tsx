"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { TransportCalendarMobile } from "./transport-calendar-mobile"
import { useApiClient } from "@/hooks/use-api-client"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Slot = "AM" | "MD" | "PM"
export const SLOTS: Slot[] = ["AM", "MD", "PM"]

export interface SlotData {
  bookings: number
  capacity: number
  dispo: number
}

export interface DayData {
  date: number
  slots: Record<Slot, SlotData>
}

interface SlotChange {
  slot: Slot
  oldCapacity: number
  newCapacity: number
}

interface DayChange {
  day: number
  slotChanges: SlotChange[]
}

interface CalendarState {
  year: number
  month: number
}

interface ApiSlotData {
  bookings: number
  capacity: number
  available: number
}
interface ApiDayData {
  AM: ApiSlotData
  MD: ApiSlotData
  PM: ApiSlotData
}
interface HotelTransportAvailability {
  hotelId: string
  monthId: string
  dates: Record<string, ApiDayData>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

function emptySlot(): SlotData {
  return { bookings: 0, capacity: 0, dispo: 0 }
}
function emptyDayData(date: number): DayData {
  return { date, slots: { AM: emptySlot(), MD: emptySlot(), PM: emptySlot() } }
}

function firstDayOfMonth(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}
function formatMonthId(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

function apiToDayData(apiData: HotelTransportAvailability): Record<number, DayData> {
  const data: Record<number, DayData> = {}
  for (const [dateStr, dateInfo] of Object.entries(apiData.dates)) {
    const day = parseInt(dateStr.split("-")[2], 10)
    data[day] = {
      date: day,
      slots: {
        AM: { bookings: dateInfo.AM.bookings, capacity: dateInfo.AM.capacity, dispo: dateInfo.AM.available },
        MD: { bookings: dateInfo.MD.bookings, capacity: dateInfo.MD.capacity, dispo: dateInfo.MD.available },
        PM: { bookings: dateInfo.PM.bookings, capacity: dateInfo.PM.capacity, dispo: dateInfo.PM.available },
      },
    }
  }
  return data
}

export function dispoColor(dispo: number | undefined): string {
  if (dispo === undefined || dispo === null) return "#9CA3AF"
  if (dispo > 0) return "#16A34A"
  if (dispo === 0) return "#F59E0B"
  return "#DC2626"
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number | null
  data: DayData | undefined
  onCapacityChange: (day: number, slot: Slot, value: string) => void
  isPast: boolean
}

function DayCell({ day, data, onCapacityChange, isPast }: DayCellProps) {
  if (day === null) {
    return (
      <td
        className="border border-gray-300 bg-gray-100 relative"
        style={{ minHeight: 148, height: 148 }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #e9ebee 0px, #e9ebee 1px, transparent 1px, transparent 8px)",
          }}
        />
      </td>
    )
  }

  return (
    <td
      className="border border-gray-300 bg-white relative py-1.5 pl-3 pr-1.5 align-top"
      style={{ minHeight: 148, height: 148, width: "14.28%" }}
    >
      {/* Day badge */}
      <div
        className="absolute top-0 right-0 min-w-[24px] h-6 flex items-center justify-center rounded-bl text-[11px] font-bold px-1"
        style={{ backgroundColor: "rgb(51 147 29)", color: "#ffffff" }}
      >
        {day}
      </div>

      {/* Grid: label col + 3 slot cols */}
      <div className="mt-7 pr-0.5">

        {/* Header row: slot names */}
        <div className="grid items-center mb-1.5" style={{ gridTemplateColumns: "14px 1fr 1fr 1fr" }}>
          <span />
          {SLOTS.map((slot) => (
            <span key={slot} className="text-center font-bold tracking-wide" style={{ fontSize: 9, color: "#9CA3AF" }}>
              {slot}
            </span>
          ))}
        </div>

        {/* B row: Bookings (read-only) */}
        <div className="grid items-center mb-1" style={{ gridTemplateColumns: "14px 1fr 1fr 1fr" }}>
          <span className="font-bold" style={{ fontSize: 9, color: "#9CA3AF" }}>B</span>
          {SLOTS.map((slot) => (
            <span key={slot} className="text-center text-xs" style={{ color: "#6B7280" }}>
              {data?.slots[slot]?.bookings ?? "-"}
            </span>
          ))}
        </div>

        {/* C row: Capacity (editable) */}
        <div className="grid items-center gap-x-0.5 mb-1" style={{ gridTemplateColumns: "14px 1fr 1fr 1fr" }}>
          <span className="font-bold" style={{ fontSize: 9, color: "#9CA3AF" }}>C</span>
          {SLOTS.map((slot) =>
            isPast ? (
              <span key={slot} className="text-center text-xs font-bold" style={{ color: "#0D2B45" }}>
                {data?.slots[slot]?.capacity ?? "-"}
              </span>
            ) : (
              <input
                key={slot}
                type="text"
                inputMode="numeric"
                value={data?.slots[slot]?.capacity ?? ""}
                onChange={(e) => onCapacityChange(day, slot, e.target.value.replace(/\D/g, ""))}
                className="w-full text-center font-bold border border-gray-300 rounded focus:outline-none focus:border-yellow-400"
                style={{ fontSize: 10, color: "#0D2B45", backgroundColor: "#FFFDE7", minWidth: 0, padding: "1px 0" }}
                aria-label={`Capacidad ${slot} día ${day}`}
              />
            )
          )}
        </div>

        {/* D row: Disponibilidad */}
        <div className="grid items-center" style={{ gridTemplateColumns: "14px 1fr 1fr 1fr" }}>
          <span className="font-bold" style={{ fontSize: 9, color: "#9CA3AF" }}>D</span>
          {SLOTS.map((slot) => {
            const dispo = data?.slots[slot]?.dispo
            return (
              <span key={slot} className="text-center text-xs font-bold" style={{ color: dispoColor(dispo) }}>
                {dispo ?? "-"}
              </span>
            )
          })}
        </div>

      </div>
    </td>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TransportCalendarProps {
  hotelId: string
}

export function TransportCalendar({ hotelId }: TransportCalendarProps) {
  const today = new Date()
  const { apiFetch } = useApiClient()
  const [cal, setCal] = useState<CalendarState>({ year: today.getFullYear(), month: today.getMonth() })
  const [dayData, setDayData] = useState<Record<number, DayData>>({})
  const [originalData, setOriginalData] = useState<Record<number, DayData>>({})
  const [bulkCapacity, setBulkCapacity] = useState<string>("10")
  const [bulkSlot, setBulkSlot] = useState<Slot>("AM")
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchAvailability = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const monthId = formatMonthId(year, month)
      const data = await apiFetch<HotelTransportAvailability>(`/api/hotel/transport/availability/${hotelId}/${monthId}`)
      const converted = apiToDayData(data)
      setDayData(converted)
      setOriginalData(converted)
    } catch (error) {
      console.error("Error fetching transport availability:", error)
    } finally {
      setLoading(false)
    }
  }, [hotelId, apiFetch])

  useEffect(() => {
    fetchAvailability(cal.year, cal.month)
  }, [cal.year, cal.month, fetchAvailability])

  const MIN_YEAR = 2026
  const MIN_MONTH = 2
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1)
  const MAX_YEAR = maxDate.getFullYear()
  const MAX_MONTH = maxDate.getMonth()

  const canGoPrev = cal.year > MIN_YEAR || (cal.year === MIN_YEAR && cal.month > MIN_MONTH)
  const canGoNext = cal.year < MAX_YEAR || (cal.year === MAX_YEAR && cal.month < MAX_MONTH)

  function prevMonth() {
    if (!canGoPrev) return
    setCal((prev) => { const d = new Date(prev.year, prev.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  function nextMonth() {
    if (!canGoNext) return
    setCal((prev) => { const d = new Date(prev.year, prev.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }

  function handleCapacityChange(day: number, slot: Slot, value: string) {
    const parsed = parseInt(value, 10)
    const capacity = isNaN(parsed) ? 0 : Math.max(0, Math.min(99, parsed))
    setDayData((prev) => {
      const dayEntry = prev[day] ?? emptyDayData(day)
      const slotEntry = dayEntry.slots[slot]
      return {
        ...prev,
        [day]: {
          ...dayEntry,
          slots: {
            ...dayEntry.slots,
            [slot]: { ...slotEntry, capacity, dispo: capacity - slotEntry.bookings },
          },
        },
      }
    })
  }

  function handleBulkUpdate() {
    const newCap = parseInt(bulkCapacity, 10)
    if (isNaN(newCap) || bulkCapacity === "") return
    const todayDate = today.getDate()
    const isCurrentMonth = cal.year === today.getFullYear() && cal.month === today.getMonth()
    setDayData((prev) => {
      const updated = { ...prev }
      for (let d = 1; d <= totalDays; d++) {
        if (isCurrentMonth && d < todayDate) continue
        const dayEntry = updated[d] ?? emptyDayData(d)
        const bookings = dayEntry.slots[bulkSlot].bookings
        updated[d] = {
          ...dayEntry,
          slots: {
            ...dayEntry.slots,
            [bulkSlot]: { bookings, capacity: newCap, dispo: newCap - bookings },
          },
        }
      }
      return updated
    })
  }

  function getChangedDays(): DayChange[] {
    const changes: DayChange[] = []
    for (const dayStr of Object.keys(dayData)) {
      const day = parseInt(dayStr, 10)
      const current = dayData[day]
      const original = originalData[day]
      const slotChanges: SlotChange[] = []
      for (const slot of SLOTS) {
        const currentCap = current?.slots[slot]?.capacity ?? 0
        const originalCap = original?.slots[slot]?.capacity ?? 0
        if (currentCap !== originalCap) {
          slotChanges.push({ slot, oldCapacity: originalCap, newCapacity: currentCap })
        }
      }
      if (slotChanges.length > 0) changes.push({ day, slotChanges })
    }
    return changes.sort((a, b) => a.day - b.day)
  }

  function handleSaveClick() {
    setSaveError(null)
    setShowSaveModal(true)
  }

  async function handleConfirmSave() {
    const changes = getChangedDays()
    if (changes.length === 0) return
    const monthId = formatMonthId(cal.year, cal.month)
    const dates: Record<string, Record<string, { capacity: number }>> = {}
    for (const { day, slotChanges } of changes) {
      if (isPastDay(day)) continue
      const dateKey = `${monthId}-${String(day).padStart(2, "0")}`
      dates[dateKey] = {}
      for (const { slot, newCapacity } of slotChanges) {
        dates[dateKey][slot] = { capacity: newCapacity }
      }
    }
    if (Object.keys(dates).length === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      await apiFetch(`/api/hotel/transport/availability/${hotelId}/${monthId}`, {
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

  function handleCancelSave() {
    if (saving) return
    setShowSaveModal(false)
  }

  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  function isPastDay(day: number): boolean {
    if (cal.year < todayYear) return true
    if (cal.year === todayYear && cal.month < todayMonth) return true
    if (cal.year === todayYear && cal.month === todayMonth && day < todayDate) return true
    return false
  }

  const firstDay = firstDayOfMonth(cal.year, cal.month)
  const totalDays = daysInMonth(cal.year, cal.month)
  const slots: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) slots.push(null)
  for (let d = 1; d <= totalDays; d++) slots.push(d)
  while (slots.length % 7 !== 0) slots.push(null)
  const weeks: (number | null)[][] = []
  for (let w = 0; w < slots.length / 7; w++) weeks.push(slots.slice(w * 7, w * 7 + 7))

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans">

      {/* Desktop */}
      <div className="hidden md:block">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} disabled={!canGoPrev}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            style={{ color: "#1a3a5c" }} aria-label="Mes anterior">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <h1 className="text-3xl font-bold uppercase tracking-wider" style={{ color: "#0D2B45" }}>
            {MONTH_NAMES_ES[cal.month]} {cal.year}
          </h1>
          <button onClick={nextMonth} disabled={!canGoNext}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            style={{ color: "#1a3a5c" }} aria-label="Mes siguiente">
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mb-4 px-1">
          {[
            { label: "B", desc: "Reservas" },
            { label: "C", desc: "Capacidad (editable)" },
            { label: "D", desc: "Disponible" },
          ].map(({ label, desc }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
              <span className="font-bold text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F3F4F6", color: "#0D2B45" }}>{label}</span>
              {desc}
            </span>
          ))}
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
                  <th key={name} className="border border-gray-300 py-2 text-center text-sm font-semibold"
                    style={{ backgroundColor: "#4B5563", color: "#ffffff", width: "14.28%" }}>
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

        {/* Bulk update */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm mb-3 text-right" style={{ color: "#4B5563" }}>
            Establecer capacidad para todos los días futuros:
          </p>
          <div className="flex flex-wrap items-center gap-4 justify-end">
            {/* Radio buttons */}
            <div className="flex items-center gap-4">
              {SLOTS.map((slot) => (
                <label key={slot} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="bulk-slot-desktop"
                    value={slot}
                    checked={bulkSlot === slot}
                    onChange={() => setBulkSlot(slot)}
                    className="w-4 h-4 cursor-pointer accent-[#1a3a5c]"
                  />
                  <span className="text-sm font-bold" style={{ color: "#0D2B45" }}>{slot}</span>
                </label>
              ))}
            </div>

            <span style={{ color: "#D1D5DB" }}>|</span>

            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "#4B5563" }}>Capacidad:</span>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(e.target.value.replace(/\D/g, ""))}
                className="w-16 text-center text-sm font-bold border-2 border-gray-400 rounded focus:outline-none py-1"
                style={{ color: "#0D2B45" }}
                aria-label="Capacidad masiva"
              />
            </div>

            <button onClick={handleBulkUpdate}
              className="px-5 py-1.5 rounded text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}>
              Aplicar
            </button>
          </div>
        </div>

        <p className="text-xs text-right mt-2" style={{ color: "#9CA3AF" }}>Hotel ID: {hotelId}</p>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <TransportCalendarMobile
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
          bulkSlot={bulkSlot}
          onBulkSlotChange={setBulkSlot}
          onBulkUpdate={handleBulkUpdate}
          hotelId={hotelId}
          onSaveClick={handleSaveClick}
        />
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden" style={{ maxHeight: "80vh" }}>

            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#1a3a5c" }}>
              <h2 className="text-lg font-bold text-white">Confirmar cambios</h2>
              <button onClick={handleCancelSave} className="text-white hover:opacity-70 transition-opacity" aria-label="Cerrar">
                <X size={24} />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
              {(() => {
                const changes = getChangedDays()
                if (changes.length === 0) {
                  return <p className="text-sm" style={{ color: "#4B5563" }}>No hay cambios para guardar.</p>
                }
                return (
                  <>
                    <p className="text-sm mb-4" style={{ color: "#4B5563" }}>Los siguientes días serán actualizados:</p>
                    <div className="space-y-3">
                      {changes.map(({ day, slotChanges }) => (
                        <div key={day}>
                          <p className="text-sm font-bold mb-1" style={{ color: "#0D2B45" }}>Día {day}</p>
                          <div className="space-y-1 pl-3">
                            {slotChanges.map(({ slot, oldCapacity, newCapacity }) => (
                              <div key={slot} className="flex items-center justify-between py-1 px-3 rounded"
                                style={{ backgroundColor: "#F3F4F6" }}>
                                <span className="text-xs font-bold" style={{ color: "#6B7280" }}>{slot}</span>
                                <span className="text-xs" style={{ color: "#4B5563" }}>
                                  Capacidad: {oldCapacity} →{" "}
                                  <span className="font-bold" style={{ color: "rgb(51 147 29)" }}>{newCapacity}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <p className="text-sm mb-4" style={{ color: "#0D2B45" }}>
                ¿Desea guardar estos cambios para el mes de{" "}
                <span className="font-bold">{MONTH_NAMES_ES[cal.month]} {cal.year}</span>?
              </p>
              {saveError && (
                <p className="text-sm mb-3 font-medium" style={{ color: "#9B1C1C" }}>{saveError}</p>
              )}
              <div className="flex gap-3 justify-end">
                <button onClick={handleCancelSave} disabled={saving}
                  className="px-6 py-2 rounded text-sm font-bold border-2 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: "#9CA3AF", color: "#4B5563" }}>
                  Cancelar
                </button>
                <button onClick={handleConfirmSave} disabled={getChangedDays().length === 0 || saving}
                  className="px-6 py-2 rounded text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#1a3a5c", color: "#ffffff" }}>
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
